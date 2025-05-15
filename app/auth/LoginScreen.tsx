import { useAuth } from "@/context/AuthContext";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // No need to navigate here - AuthContext handles navigation after login
    } catch (error: any) {
      let errorMessage = "Failed to log in. Please try again.";
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInWithGoogle = () => {
    console.log("continue with google");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    welcomeText: {
      fontFamily: "InterRegular",
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: "center",
    },
    inputContainer: {
      marginHorizontal: 24,
      marginBottom: 16,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginBottom: 20,
      height: 56,
    },
    inputOutline: {
      borderRadius: 12,
      borderWidth: 1.5,
    },
    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 32,
      fontFamily: "InterMedium",
      color: theme.colors.primary,
      fontSize: 14,
    },
    signInButton: {
      marginHorizontal: 24,
      borderRadius: 12,
      paddingVertical: 6,
      elevation: 2,
    },
    signInButtonLabel: {
      fontFamily: "InterSemiBold",
      fontSize: 16,
      paddingVertical: 4,
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 24,
      marginVertical: 32,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    dividerText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: 16,
    },
    googleButton: {
      marginHorizontal: 24,
      borderRadius: 12,
      paddingVertical: 6,
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 1,
    },
    googleButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      gap: 12,
    },
    googleButtonText: {
      fontSize: 16,
      fontFamily: "InterMedium",
      color: theme.colors.onSurface,
    },
    signUpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 32,
      marginBottom: 16,
    },
    signUpText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    signUpLink: {
      fontFamily: "InterSemiBold",
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Welcome Back</Text>
        <Text style={styles.welcomeText}>
          Sign in to continue to your account
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          label="Email address"
          value={email}
          mode="outlined"
          outlineStyle={[
            styles.inputOutline,
            { borderColor: theme.colors.primary },
          ]}
          left={
            <TextInput.Icon color={theme.colors.primary} icon="email-outline" />
          }
          onChangeText={(text) => setEmail(text)}
          style={styles.textInput}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          label="Password"
          value={password}
          mode="outlined"
          outlineStyle={[
            styles.inputOutline,
            { borderColor: theme.colors.primary },
          ]}
          left={
            <TextInput.Icon color={theme.colors.primary} icon="lock-outline" />
          }
          right={
            <TextInput.Icon
              color={theme.colors.primary}
              icon={showPassword ? "eye-off-outline" : "eye-outline"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          onChangeText={(text) => setPassword(text)}
          secureTextEntry={!showPassword}
          style={styles.textInput}
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <Button
        mode="contained"
        labelStyle={styles.signInButtonLabel}
        style={styles.signInButton}
        onPress={handleSignIn}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          "Sign In"
        )}
      </Button>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      <Button
        mode="outlined"
        style={styles.googleButton}
        onPress={handleSignInWithGoogle}
      >
        <View style={styles.googleButtonContent}>
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </View>
      </Button>

      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/RegisterScreen")}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
