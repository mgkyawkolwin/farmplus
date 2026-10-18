'use client';

import * as React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
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
  rowVersion: '',
  roleId: '',
};

export default function UserFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [form, setForm] = React.useState<UserFormState>(emptyForm);
  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(mode === 'edit');
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [rolePickerVisible, setRolePickerVisible] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    roleService.getRoles(1, 100).then((items) => {
      if (active) setRoles(items);
    }).catch(() => {
      if (active) SnackBar.Error('Failed to load roles');
    });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (mode !== 'edit') return;
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
  }, [mode, router, userId]);

  const updateField = (field: keyof UserFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
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

      {pageLoading ? (
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

          <View style={styles.field}>
            <Label className="text-foreground">Role <Text className="text-red-500">*</Text></Label>
            <Pressable style={styles.roleSelect} onPress={() => setRolePickerVisible(true)} disabled={loading}>
              <Text className="text-foreground" numberOfLines={1}>
                {roles.find((item) => item.id === form.roleId)?.role ?? 'Choose a role'}
              </Text>
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
        </KeyboardAwareScrollView>
      )}
      <Modal transparent visible={rolePickerVisible} animationType="slide" onRequestClose={() => setRolePickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRolePickerVisible(false)}>
          <View style={styles.rolePicker}>
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
        </Pressable>
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
  roleSelect: { minHeight: 44, justifyContent: 'center', marginTop: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000066' },
  rolePicker: { maxHeight: '70%', padding: 16, borderRadius: 8, backgroundColor: '#FFFFFF' },
  rolePickerTitle: { marginBottom: 10, fontSize: 16, fontWeight: '700' },
  roleOption: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  actionButton: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
});