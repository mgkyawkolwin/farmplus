'use client';

import * as React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
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
import { IRoleService } from '@/services/roleService';

const roleService = container.resolve<IRoleService>(DI_TOKENS.IRoleService);

export default function RoleFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const roleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [role, setRole] = React.useState('');
  const [rowVersion, setRowVersion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(mode === 'edit');

  React.useEffect(() => {
    if (mode !== 'edit') return;
    if (!roleId) {
      router.back();
      return;
    }

    let active = true;
    roleService.getRoleById(roleId).then((item) => {
      if (!active) return;
      setRole(item.role);
      setRowVersion(item.rowVersion ?? '');
    }).catch(() => {
      if (active) {
        SnackBar.Error('Failed to load role details');
        router.back();
      }
    }).finally(() => {
      if (active) setPageLoading(false);
    });

    return () => { active = false; };
  }, [mode, roleId, router]);

  const handleSubmit = async () => {
    const normalizedRole = role.trim();
    if (!normalizedRole) {
      SnackBar.Error('Role is required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await roleService.createRole({ role: normalizedRole });
        SnackBar.Success('Role created successfully');
      } else {
        if (!roleId) return;
        await roleService.updateRole(roleId, { role: normalizedRole, rowVersion });
        SnackBar.Success('Role updated successfully');
      }
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : `Failed to ${mode} role`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{mode === 'create' ? 'New Role' : 'Edit Role'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.loadingText}>Loading role details...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.formContent}
          enableOnAndroid
          extraScrollHeight={40}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Label className="text-foreground">Role <Text className="text-red-500">*</Text></Label>
            <Input
              placeholder="Enter role"
              value={role}
              onChangeText={setRole}
              maxLength={50}
              editable={!loading}
              className="mt-2"
            />
          </View>
          <View style={styles.actions}>
            <Button variant="outline" style={styles.actionButton} onPress={() => router.back()} disabled={loading}>
              <Text className="text-foreground">Cancel</Text>
            </Button>
            <Button style={styles.actionButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text className="text-background font-semibold">{mode === 'create' ? 'Create Role' : 'Save Changes'}</Text>
              )}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      )}
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  actionButton: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
});