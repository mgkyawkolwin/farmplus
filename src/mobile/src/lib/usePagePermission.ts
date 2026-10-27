import * as React from 'react';
import { RolePermissionServiceClient } from '@/services/rolePermissionService';

export type PagePermissionState = 'checking' | 'authorized' | 'denied';

const permissionService = new RolePermissionServiceClient();

export function usePagePermission(permissionKey: string): PagePermissionState {
  const [state, setState] = React.useState<PagePermissionState>('checking');

  React.useEffect(() => {
    let active = true;
    setState('checking');

    permissionService.getCurrentPermissions()
      .then((permissions) => {
        if (!active) return;
        setState(
          permissions.isExempt || permissions.permissionKeys.includes(permissionKey)
            ? 'authorized'
            : 'denied',
        );
      })
      .catch(() => {
        if (active) setState('denied');
      });

    return () => {
      active = false;
    };
  }, [permissionKey]);

  return state;
}