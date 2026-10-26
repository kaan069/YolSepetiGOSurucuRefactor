/**
 * Ana ekrandaki yana kaydırmalı kart alanı (duyuru panosu ve iş kısayolu).
 * Müşteri uygulamasındaki CampaignSlider kalıbı: kartlar 16:9 (duyuru görseli detay
 * sayfasındaki gibi kırpılmadan görünür), birden fazla kartta noktalar çıkar;
 * istenirse kendiliğinden kayar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing } from '../../theme/design';

const CARD_GAP = spacing.sm;
const CARD_ASPECT = 16 / 9;
const DOTS_HEIGHT = 20;
export const CAROUSEL_PADDING_TOP = spacing.sm;
/** Tek kartta noktalar yerine alttaki boşluk */
export const CAROUSEL_PADDING_BOTTOM = spacing.sm;
const AUTO_SCROLL_INTERVAL = 5000;

export interface CarouselCardSize {
  width: number;
  height: number;
}

/** Tam genişlikteki alanda kart boyu (iki yanda spacing.md) */
export function useCarouselCardSize(): CarouselCardSize {
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2;
  return { width: cardWidth, height: Math.round(cardWidth / CARD_ASPECT) };
}

interface Props<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, size: CarouselCardSize) => React.ReactElement;
  /** 5 sn'de bir sonraki karta geçer; sürüklerken ve ekran odakta değilken durur */
  autoScroll?: boolean;
}

export default function HomeCarousel<T>({ items, keyExtractor, renderCard, autoScroll = false }: Props<T>) {
  const { tokens, isDarkMode } = useFkTokens();
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<T>>(null);
  const size = useCarouselCardSize();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const multiple = items.length > 1;
  const interval = size.width + CARD_GAP;

  // Yenilemede kart azaldıysa başa dön
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [items.length, activeIndex]);

  useEffect(() => {
    if (!autoScroll || !multiple || dragging || !isFocused) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * interval, animated: true });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [autoScroll, multiple, dragging, isFocused, interval, activeIndex, items.length]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / interval);
      if (index >= 0 && index < items.length) setActiveIndex((prev) => (prev === index ? prev : index));
    },
    [interval, items.length],
  );

  return (
    <View style={[styles.container, !multiple && styles.single]}>
      <FlatList
        ref={listRef}
        data={items}
        renderItem={({ item }) => renderCard(item, size)}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={multiple}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setDragging(true)}
        onScrollEndDrag={() => setDragging(false)}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        style={{ height: size.height, flexGrow: 0 }}
      />
      {multiple && (
        <View style={styles.dots}>
          {items.map((item, index) => (
            <View
              key={keyExtractor(item)}
              style={[
                styles.dot,
                { backgroundColor: isDarkMode ? tokens.colors.borderStrong : colors.neutral[300] },
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function Separator() {
  return <View style={{ width: CARD_GAP }} />;
}

const styles = StyleSheet.create({
  container: {
    paddingTop: CAROUSEL_PADDING_TOP,
  },
  single: {
    paddingBottom: CAROUSEL_PADDING_BOTTOM,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  dots: {
    height: DOTS_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary[500],
  },
});
