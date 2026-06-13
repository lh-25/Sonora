import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

interface FieldErrors {
  username?: string;
  password?: string;
}

function validate(username: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!username.trim()) errs.username = 'Username is required.';
  if (!password) errs.password = 'Password is required.';
  return errs;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const handleBlur = (field: 'username' | 'password') => {
    const next = { ...touched, [field]: true };
    setTouched(next);
    setFieldErrors(validate(username, password));
  };

  const handleChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') setUsername(value);
    else setPassword(value);
    if (touched[field]) {
      const updated = field === 'username' ? validate(value, password) : validate(username, value);
      setFieldErrors(updated);
    }
  };

  const handleLogin = async () => {
    setTouched({ username: true, password: true });
    const errs = validate(username, password);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setFormError('');
    try {
      await login(username.trim(), password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Network request failed')) {
        setFormError("Can't reach the server. Check your connection and try again.");
      } else {
        setFormError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Ionicons name="musical-notes" size={56} color={Colors.primary} />
          <Text style={styles.logo}>Sonora</Text>
          <Text style={styles.tagline}>Discover. Share. Connect.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, touched.username && fieldErrors.username ? styles.inputError : null]}
            value={username}
            onChangeText={(v) => handleChange('username', v)}
            onBlur={() => handleBlur('username')}
            placeholder="Enter your username"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            accessibilityLabel="Username"
          />
          {touched.username && fieldErrors.username ? (
            <Text style={styles.fieldError}>{fieldErrors.username}</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput, touched.password && fieldErrors.password ? styles.inputError : null]}
              value={password}
              onChangeText={(v) => handleChange('password', v)}
              onBlur={() => handleBlur('password')}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {touched.password && fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={['#ff4040', '#ff7b40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Log In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    gap: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  fieldError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  formError: {
    color: Colors.error,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  btn: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
