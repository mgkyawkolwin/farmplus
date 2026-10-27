'use client';

import * as React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import UnauthorizedView from '@/components/unauthorized-view';
import { container, DI_TOKENS } from '@/di';
import { usePagePermission } from '@/lib/usePagePermission';
import { IUserService } from '@/services/userService';
import { UpdateUserRequest } from '@/models/user';
import { RoleItem } from '@/models/role';
import { IRoleService } from '@/services/roleService';

const userService = container.resolve<IUserService>(DI_TOKENS.IUserService);
const roleService = container.resolve<IRoleService>(DI_TOKENS.IRoleService);

type UserFormState = {
  userName: string;
  displayName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  phone: string;
  nationalId: string;
  passportNumber: string;
  isActive: boolean;
  rowVersion: string;
  roleId: string;
};

const emptyForm: UserFormState = {
  userName: '',
  displayName: '',
  email: '',
  password: '',
  address: '',
  city: '',
  phone: '',
  nationalId: '',
  passportNumber: '',
  isActive: true,
  rowVersion: '',
  roleId: '',
};

export default function UserFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const permissionState = usePagePermission(mode === 'create' ? '/users/new' : '/users/edit');
  const [form, setForm] = React.useState<UserFormState>(emptyForm);
  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(mode === 'edit');
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [rolePickerVisible, setRolePickerVisible] = React.useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = React.useState(false);
  const [resetPasswordValue, setResetPasswordValue] = React.useState('');
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    let active = true;
    roleService.getRoles(1, 100).then((items) => {
      if (active) setRoles(items);
    }).catch(() => {
      if (active) SnackBar.Error('Failed to load roles');
    });
    return () => { active = false; };
  }, [permissionState]);

  React.useEffect(() => {
    if (mode !== 'edit' || permissionState !== 'authorized') return;
    if (!userId) {
      router.back();
      return;
    }

    let active = true;
    userService.getUserById(userId).then((user) => {
      if (!active) return;
      setForm({
        userName: user.userName ?? '',
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        password: '',
        address: user.address ?? '',
        city: user.city ?? '',
        phone: user.phone ?? '',
        nationalId: user.nationalId ?? '',
        passportNumber: user.passportNumber ?? '',
        isActive: user.isActive ?? true,
        rowVersion: user.rowVersion ?? '',
        roleId: user.roleId ?? '',
      });
    }).catch(() => {
      if (active) {
        SnackBar.Error('Failed to load user details');
        router.back();
      }
    }).finally(() => {
      if (active) setPageLoading(false);
    });

    return () => { active = false; };
  }, [mode, permissionState, router, userId]);

  const updateField = (field: keyof UserFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeResetPasswordModal = () => {
    if (isResettingPassword) return;
    setResetPasswordVisible(false);
    setResetPasswordValue('');
  };

  const handleResetPassword = async () => {
    if (!userId) {
      SnackBar.Error('Unable to identify the user');
      return;
    }
    if (!resetPasswordValue.trim()) {
      SnackBar.Error('New password is required');
      return;
    }

    setIsResettingPassword(true);
    try {
      await userService.resetPassword(userId, resetPasswordValue);
      SnackBar.Success('Password reset successfully');
      setResetPasswordVisible(false);
      setResetPasswordValue('');
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'create' && !form.userName.trim()) {
      SnackBar.Error('Username is required');
      return;
    }
    if (!form.displayName.trim()) {
      SnackBar.Error('Display name is required');
      return;
    }
    if (!form.email.trim()) {
      SnackBar.Error('Email is required');
      return;
    }
    if (mode === 'create' && !form.password) {
      SnackBar.Error('Password is required');
      return;
    }
    if (!form.roleId) {
      SnackBar.Error('Select a role for this user');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await userService.createUser({
          userName: form.userName.trim(),
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          password: form.password,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          phone: form.phone.trim() || undefined,
          nationalId: form.nationalId.trim() || undefined,
          passportNumber: form.passportNumber.trim() || undefined,
          roleId: form.roleId,
        });
        SnackBar.Success('User created successfully');
      } else {
        if (!userId) return;
        const request: UpdateUserRequest = {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          phone: form.phone.trim() || undefined,
          nationalId: form.nationalId.trim() || undefined,
          passportNumber: form.passportNumber.trim() || undefined,
          isActive: form.isActive,
          rowVersion: form.rowVersion,
          roleId: form.roleId,
        };
        await userService.updateUser(userId, request);
        SnackBar.Success('User updated successfully');
      }
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : `Failed to ${mode} user`);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create' ? 'New User' : 'Edit User';

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.loadingText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.loadingText}>Loading user details...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.formContent}
          enableOnAndroid
          extraScrollHeight={40}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'create' ? (
            <View style={styles.field}>
              <Label className="text-foreground">Username <Text className="text-red-500">*</Text></Label>
              <Input
                placeholder="Enter username"
                value={form.userName}
                onChangeText={(value) => updateField('userName', value)}
                autoCapitalize="none"
                maxLength={20}
                editable={!loading}
                className="mt-2"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Label className="text-foreground">Display Name <Text className="text-red-500">*</Text></Label>
            <Input
              placeholder="Enter display name"
              value={form.displayName}
              onChangeText={(value) => updateField('displayName', value)}
              maxLength={100}
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Email <Text className="text-red-500">*</Text></Label>
            <Input
              placeholder="Enter email address"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={50}
              editable={!loading}
              className="mt-2"
            />
          </View>

          {mode === 'create' ? (
            <View style={styles.field}>
              <Label className="text-foreground">Password <Text className="text-red-500">*</Text></Label>
              <Input
                placeholder="Create a password"
                value={form.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
                className="mt-2"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Label className="text-foreground">Address</Label>
            <Input
              placeholder="Enter street address"
              value={form.address}
              onChangeText={(value) => updateField('address', value)}
              maxLength={500}
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">City</Label>
            <Input
              placeholder="Enter city"
              value={form.city}
              onChangeText={(value) => updateField('city', value)}
              maxLength={100}
              editable={!loading}
              className="mt-2"
            />
          </View>

          {mode === 'edit' ? (
            <View style={styles.statusField}>
              <View style={styles.statusCopy}>
                <Label className="text-foreground">Active</Label>
                <Text className="text-muted-foreground">Inactive users cannot sign in.</Text>
              </View>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                disabled={loading}
                accessibilityLabel="User active status"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Label className="text-foreground">Phone</Label>
            <Input
              placeholder="Enter phone number"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              maxLength={20}
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">National ID</Label>
            <Input
              placeholder="Enter national ID"
              value={form.nationalId}
              onChangeText={(value) => updateField('nationalId', value)}
              maxLength={30}
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Passport number</Label>
            <Input
              placeholder="Enter passport number"
              value={form.passportNumber}
              onChangeText={(value) => updateField('passportNumber', value)}
              maxLength={30}
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Role <Text className="text-red-500">*</Text></Label>
            <Pressable
              style={styles.roleSelect}
              onPress={() => setRolePickerVisible(true)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={`Role: ${roles.find((item) => item.id === form.roleId)?.role ?? 'Choose a role'}`}
              accessibilityState={{ expanded: rolePickerVisible }}
            >
              <Text className="text-foreground" numberOfLines={1}>
                {roles.find((item) => item.id === form.roleId)?.role ?? 'Choose a role'}
              </Text>
              <Icon className="text-muted-foreground" as={ChevronDown} size={18} />
            </Pressable>
            {roles.length === 0 ? <Text className="text-muted-foreground">Create a role before adding users.</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button variant="outline" style={styles.actionButton} onPress={() => router.back()} disabled={loading}>
              <Text className="text-foreground">Cancel</Text>
            </Button>
            <Button style={styles.actionButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text className="text-background font-semibold">{mode === 'create' ? 'Create User' : 'Save Changes'}</Text>
              )}
            </Button>
          </View>
          {mode === 'edit' ? (
            <Button
              variant="outline"
              style={styles.resetPasswordButton}
              onPress={() => setResetPasswordVisible(true)}
              disabled={loading}
            >
              <Text className="text-foreground">Reset Password</Text>
            </Button>
          ) : null}
        </KeyboardAwareScrollView>
      )}
      <Modal transparent visible={rolePickerVisible} animationType="slide" onRequestClose={() => setRolePickerVisible(false)}>
        <View style={styles.roleModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRolePickerVisible(false)} />
          <View className="bg-background" style={styles.rolePicker}>
            <View style={styles.roleSheetHandle} />
            <Text className="text-foreground" style={styles.rolePickerTitle}>Select Role</Text>
            <ScrollView>
              {roles.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.roleOption}
                  onPress={() => {
                    updateField('roleId', item.id);
                    setRolePickerVisible(false);
                  }}
                >
                  <Text className="text-foreground">{item.role}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={resetPasswordVisible}
        animationType="slide"
        onRequestClose={closeResetPasswordModal}
      >
        <KeyboardAvoidingView style={styles.resetPasswordOverlay} behavior="padding">
          <Pressable style={styles.resetPasswordBackdrop} onPress={closeResetPasswordModal} />
          <View className="bg-background" style={styles.resetPasswordSheet}>
            <Text className="text-foreground" style={styles.rolePickerTitle}>Reset Password</Text>
            <Label className="text-foreground">New Password</Label>
            <Input
              placeholder="Enter new password"
              value={resetPasswordValue}
              onChangeText={setResetPasswordValue}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isResettingPassword}
            />
            <View style={styles.resetPasswordActions}>
              <Button
                variant="outline"
                style={styles.actionButton}
                onPress={closeResetPasswordModal}
                disabled={isResettingPassword}
              >
                <Text className="text-foreground">Cancel</Text>
              </Button>
              <Button
                style={styles.actionButton}
                onPress={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text className="text-background font-semibold">Reset</Text>
                )}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButton: { minWidth: 40 },
  headerTitle: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  formContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  statusField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  statusCopy: { gap: 4 },
  roleSelect: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6 },
  roleModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  rolePicker: { maxHeight: '70%', padding: 20, paddingBottom: 28, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  roleSheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12, backgroundColor: '#CBD5E1' },
  rolePickerTitle: { marginBottom: 10, fontSize: 16, fontWeight: '700' },
  resetPasswordOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  resetPasswordBackdrop: { ...StyleSheet.absoluteFillObject },
  resetPasswordSheet: { padding: 20, paddingBottom: 32, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 10 },
  resetPasswordActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  resetPasswordButton: { width: '100%', marginTop: 12 },
  roleOption: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  actionButton: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
});