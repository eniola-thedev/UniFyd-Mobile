import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "unifyd-biometric-enabled";
const BIOMETRIC_USER_EMAIL_KEY = "unifyd-biometric-email";

export type BiometricType = "FACE_ID" | "FINGERPRINT" | "FACE_RECOGNITION" | "IRIS" | null;

type BiometricState = {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
  enrolledEmail: string | null;
};

/**
 * Hook for Face ID / fingerprint authentication.
 * When enabled, the app can re-authenticate the user without a password.
 */
export function useBiometrics() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometricType: null,
    isEnabled: false,
    enrolledEmail: null,
  });

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.getSupportedAuthenticationTypesAsync();

      let type: BiometricType = null;
      if (enrolled && compatible) {
        if (types.includes(LocalAuthentication.AuthenticationType.FACE_ID)) type = "FACE_ID";
        else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) type = "FINGERPRINT";
        else if (types.includes(LocalAuthentication.AuthenticationType.FACE_RECOGNITION)) type = "FACE_RECOGNITION";
        else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) type = "IRIS";
      }

      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY) === "true";
      const email = await SecureStore.getItemAsync(BIOMETRIC_USER_EMAIL_KEY);

      setState({
        isAvailable: compatible && enrolled,
        biometricType: type,
        isEnabled: enabled,
        enrolledEmail: email,
      });
    })();
  }, []);

  const authenticate = useCallback(
    async (promptMessage = "Confirm your identity to sign in to UniFyd"): Promise<boolean> => {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        fallbackLabel: "Use password",
        requireFallback: false,
      });
      return result.success;
    },
    [],
  );

  const enable = useCallback(async (email: string) => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
    await SecureStore.setItemAsync(BIOMETRIC_USER_EMAIL_KEY, email);
    setState((s) => ({ ...s, isEnabled: true, enrolledEmail: email }));
  }, []);

  const disable = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_USER_EMAIL_KEY);
    setState((s) => ({ ...s, isEnabled: false, enrolledEmail: null }));
  }, []);

  const getBiometricLabel = useCallback((type: BiometricType): string => {
    switch (type) {
      case "FACE_ID": return "Face ID";
      case "FINGERPRINT": return "Fingerprint";
      case "FACE_RECOGNITION": return "Face recognition";
      case "IRIS": return "Iris";
      default: return "Biometrics";
    }
  }, []);

  return {
    ...state,
    authenticate,
    enable,
    disable,
    getBiometricLabel,
  };
}