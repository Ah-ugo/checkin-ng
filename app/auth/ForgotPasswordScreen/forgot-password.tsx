import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  const handleResetPassword = () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    // Simulate API call to send reset password email
    setTimeout(() => {
      setLoading(false);
      setEmailSent(true);
      // You would typically make an API call here
      console.log("Reset password email sent to:", email);
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    headerContainer: {
      marginTop: 60,
      marginBottom: 40,
      alignItems: "center",
    },
    headerText: {
      fontFamily: "InterBold",
      fontSize: 28,
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    instructionText: {
      fontFamily: "InterRegular",
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: "center",
      marginBottom: 32,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginBottom: 12,
      height: 56,
    },
    inputOutline: {
      borderRadius: 12,
      borderWidth: 1.5,
    },
    resetButton: {
      marginTop: 24,
      borderRadius: 12,
      paddingVertical: 6,
      elevation: 2,
    },
    buttonLabel: {
      fontFamily: "InterSemiBold",
      fontSize: 16,
      paddingVertical: 4,
      letterSpacing: 0.5,
    },
    backToLoginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 32,
    },
    backToLoginText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    backToLoginLink: {
      fontFamily: "InterSemiBold",
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    successContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    successIcon: {
      backgroundColor: theme.colors.primaryContainer,
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    successTitle: {
      fontFamily: "InterBold",
      fontSize: 24,
      color: theme.colors.primary,
      marginBottom: 16,
      textAlign: "center",
    },
    successMessage: {
      fontFamily: "InterRegular",
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 32,
    },
    emailHighlight: {
      fontFamily: "InterMedium",
      color: theme.colors.onSurface,
    },
  });

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <TextInput.Icon
              color={theme.colors.primary}
              icon="email-check"
              size={40}
            />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{" "}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Button
            mode="contained"
            labelStyle={styles.buttonLabel}
            style={styles.resetButton}
            onPress={() => navigation.goBack()}
          >
            <Text>Back to Login</Text>
          </Button>
          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.backToLoginText}>
              Didn't receive the email?
            </Text>
            <Text style={styles.backToLoginLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Forgot Password</Text>
          <Text style={styles.instructionText}>
            Enter your email address and we'll send you a link to reset your
            password
          </Text>
        </View>

        <TextInput
          label="Email address"
          value={email}
          mode="outlined"
          outlineStyle={[
            styles.inputOutline,
            { borderColor: error ? theme.colors.error : theme.colors.primary },
          ]}
          left={
            <TextInput.Icon
              color={error ? theme.colors.error : theme.colors.primary}
              icon="email-outline"
            />
          }
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          style={styles.textInput}
          autoCapitalize="none"
          keyboardType="email-address"
          error={!!error}
        />
        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          labelStyle={styles.buttonLabel}
          style={styles.resetButton}
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
        >
          <Text>Reset Password</Text>
        </Button>

        <View style={styles.backToLoginContainer}>
          <Text style={styles.backToLoginText}>Remember your password?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backToLoginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
