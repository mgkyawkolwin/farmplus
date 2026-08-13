'use client';

import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export type DropdownModelItem = {
  label: string;
  value: string;
};

interface DropdownModelProps {
  items: DropdownModelItem[];
  value?: string;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  onSelect: (item: DropdownModelItem) => void;
}

export default function DropdownModel({
  items,
  value,
  placeholder,
  title,
  disabled,
  onSelect,
}: DropdownModelProps) {
  const [visible, setVisible] = React.useState(false);

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value],
  );

  const label = selectedItem?.label ?? placeholder ?? 'Select';

  const open = () => {
    if (!disabled) {
      setVisible(true);
    }
  };

  const close = () => setVisible(false);

  const handleSelect = (item: DropdownModelItem) => {
    onSelect(item);
    close();
  };

  return (
    <>
      <Pressable style={[styles.trigger, disabled && styles.disabled]} onPress={open}>
        <Text style={[styles.triggerText, !selectedItem && styles.placeholderText]}>{label}</Text>
        <Icon as={ChevronDown} size={18} className='text-muted-foreground' />
      </Pressable>

      <Modal transparent visible={visible} animationType='slide' onRequestClose={close}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={close} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text variant='h4' className='text-foreground'>{title ?? 'Select an option'}</Text>
              <Pressable onPress={close} style={styles.closeButton}>
                <Icon as={X} size={20} className='text-foreground' />
              </Pressable>
            </View>
            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => handleSelect(item)}
                  style={styles.item}
                >
                  <Text className='text-foreground'>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    opacity: 0.65,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  placeholderText: {
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeButton: {
    padding: 8,
  },
  itemList: {
    flexGrow: 0,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
