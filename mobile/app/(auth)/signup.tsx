import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

function validate(username: string, email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!username.trim()) errs.username = 'Username is required.';
  else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters.';
  if (!email.trim()) errs.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
  if (!password) errs.password = 'Password is required.';
  else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
  return errs;
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const handleBlur = (field: 'username' | 'email' | 'password') => {
    const next = { ...touched, [field]: true };
    setTouched(next);
    setFieldErrors(validate(username, email, password));
  };

  const handleChange = (field: 'username' | 'email' | 'password', value: string) => {
    if (field === 'username') setUsername(value);
    else if (field === 'email') setEmail(value);
    else setPassword(value);
    if (touched[field]) {
      const u = field === 'username' ? value : username;
      const em = field === 'email' ? value : email;
      const p = field === 'password' ? value : password;
      setFieldErrors(validate(u, em, p));
    }
  };

  const handleSignup = async () => {
    setTouched({ username: true, email: true, password: true });
    const errs = validate(username, email, password);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setFormError('');
    try {
      await signup(username.trim(), email.trim(), password, bio);
    } catch (e: any) {
      try {
        const msg = JSON.parse(e.message);
        const serverErrs: FieldErrors = {};
        let generic = '';
        for (const [key, val] of Object.entries(msg)) {
          const text = Array.isArray(val) ? (val as string[])[0] : String(val);
          if (key === 'username') serverErrs.username = text;
          else if (key === 'email') serverErrs.email = text;
          else if (key === 'password') serverErrs.password = text;
          else generic = text;
        }
        if (Object.keys(serverErrs).length > 0) {
          setFieldErrors(serverErrs);
          setTouched({ username: true, email: true, password: true });
        } else {
          setFormError(generic || 'Sign up failed. Please try again.');
        }
      } catch {
        setFormError('Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="musical-notes" size={44} color={Colors.primary} />
          <Text style={styles.logo}>Create Account</Text>
          <Text style={styles.tagline}>Join the Sonora community</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={[styles.input, touched.username && fieldErrors.username ? styles.inputError : null]}
            value={username}
            onChangeText={(v) => handleChange('username', v)}
            onBlur={() => handleBlur('username')}
            placeholder="Choose a username"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Username"
          />
          {touched.username && fieldErrors.username ? (
            <Text style={styles.fieldError}>{fieldErrors.username}</Text>
          ) : null}

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, touched.email && fieldErrors.email ? styles.inputError : null]}
            value={email}
            onChangeText={(v) => handleChange('email', v)}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email"
          />
          {touched.email && fieldErrors.email ? (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          ) : null}

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput, touched.password && fieldErrors.password ? styles.inputError : null]}
              value={password}
              onChangeText={(v) => handleChange('password', v)}
              onBlur={() => handleBlur('password')}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              accessibilityLabel="Password"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {touched.password && fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself (optional)"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Log in</Text>
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
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
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  loginText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
