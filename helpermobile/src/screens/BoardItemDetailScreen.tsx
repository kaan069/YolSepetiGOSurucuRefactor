/**
 * Ana ekran panosundaki bir duyurunun / reklamın detayı.
 * İçerik pano yanıtıyla gelir (store); ayrı istek atılmaz.
 */
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import AppBar from '../components/common/AppBar';
import { FkButton, FkEmptyState, FkStickyFooter } from '../components/fk';
import { useAppTheme } from '../hooks/useAppTheme';
import { useBoardItem } from '../store/useDriverBoardStore';
import { dateLabel } from '../constants/backendLabels';
import { resolveAppLink } from '../constants/appLinks';
import driverBoardAPI from '../api/driverBoard';
import { logger } from '../utils/logger';
import { radius, spacing, text } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'BoardItemDetail'>;

type Cta = { kind: 'app'; open: () => void } | { kind: 'external'; url: string };

/**
 * cta_url → buton davranışı. Uygulama içi: `app://<anahtar>` (constants/appLinks);
 * dışarı: yalnızca https, tel, mailto. Tanınmayan bağlantıda buton gösterilmez.
 */
function resolveCta(url: string | null | undefined, navigation: Props['navigation']): Cta | null {
  if (!url) return null;
  const openInApp = resolveAppLink(url);
  if (openInApp) return { kind: 'app', open: () => openInApp(navigation) };
  if (/^(https:\/\/|tel:|mailto:)/i.test(url.trim())) return { kind: 'external', url: url.trim() };
  return null;
}

export default function BoardItemDetailScreen({ route, navigation }: Props) {
  const { screenBg, textPrimary, textSecondary } = useAppTheme();
  const item = useBoardItem(route.params.itemId);

  const cta = resolveCta(item?.cta_url, navigation);
  const ctaLabel = item?.cta_label || 'Devam Et';

  const openCta = () => {
    if (!item || !cta) return;
    driverBoardAPI.trackClick(item.id, 'cta');
    if (cta.kind === 'app') {
      cta.open();
      return;
    }
    Linking.openURL(cta.url).catch(() => logger.warn('general', 'BoardItemDetail.openCta failed'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={cta ? [] : ['bottom']}>
      <AppBar title="Duyuru" />
      {!item ? (
        <View style={styles.center}>
          <FkEmptyState
            icon="bullhorn-outline"
            title="Bu içerik artık yayında değil"
            message="Güncel duyurular ana ekrandaki panoda yer alır."
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {!!item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
            )}
            <Text style={[styles.title, { color: textPrimary }]}>{item.title}</Text>
            {!!item.published_at && (
              <Text style={[styles.date, { color: textSecondary }]}>{dateLabel(item.published_at)}</Text>
            )}
            {!!(item.body || item.summary) && (
              <Text style={[styles.body, { color: textPrimary }]} selectable>
                {item.body || item.summary}
              </Text>
            )}
          </ScrollView>
          {cta && (
            <FkStickyFooter>
              <FkButton
                fullWidth
                onPress={openCta}
                icon={cta.kind === 'app' ? 'chevron-right' : 'open-in-new'}
                iconPosition="right"
              >
                {ctaLabel}
              </FkButton>
            </FkStickyFooter>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...text.section,
  },
  date: {
    ...text.meta,
    marginTop: spacing.xs,
  },
  body: {
    ...text.body,
    lineHeight: 22,
    marginTop: spacing.md,
  },
});
