import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../../hooks/useFkTokens';
import { FkSelectOption } from '../types';

interface Props<T extends string | number> {
  options: FkSelectOption<T>[];
  selected: T | T[] | null;
  isSelected: (value: T) => boolean;
  onPick: (value: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function SelectList<T extends string | number>({
  options,
  isSelected,
  onPick,
  searchable,
  searchPlaceholder = 'Ara...',
  emptyMessage = 'Sonuç bulunamadı',
}: Props<T>) {
  const { tokens } = useFkTokens();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        String(opt.value).toLowerCase().includes(q),
    );
  }, [options, search, searchable]);

  return (
    <View>
      {searchable ? (
        <View style={{ padding: tokens.spacing.lg }}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.md },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={tokens.colors.textSecondary} />
            <RNTextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={tokens.colors.textHint}
              style={[styles.searchInput, { color: tokens.colors.textPrimary }]}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle" size={18} color={tokens.colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="magnify-close" size={36} color={tokens.colors.textHint} />
            <Text style={{ color: tokens.colors.textSecondary, marginTop: 8 }}>{emptyMessage}</Text>
          </View>
        ) : (
          filtered.map((opt) => {
            const selected = isSelected(opt.value);
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => !opt.disabled && onPick(opt.value)}
                disabled={opt.disabled}
                style={[
                  styles.item,
                  selected && { backgroundColor: `${tokens.colors.primary}15` },
                  { opacity: opt.disabled ? 0.5 : 1 },
                ]}
              >
                <View style={styles.itemLeft}>
                  {opt.icon ? <Text style={styles.itemIcon}>{opt.icon}</Text> : null}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemLabel,
                        {
                          color: selected ? tokens.colors.primary : tokens.colors.textPrimary,
                          fontWeight: selected ? '600' : '400',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.description ? (
                      <Text style={[styles.itemDesc, { color: tokens.colors.textSecondary }]}>
                        {opt.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {selected ? (
                  <MaterialCommunityIcons name="check" size={20} color={tokens.colors.primary} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { maxHeight: 480, paddingHorizontal: 8 },
  listContent: { paddingBottom: 16, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginVertical: 1,
    borderRadius: 8,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  itemIcon: { fontSize: 18 },
  itemLabel: { fontSize: 15 },
  itemDesc: { fontSize: 12, marginTop: 2 },
});
