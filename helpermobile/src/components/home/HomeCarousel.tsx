/**
 * Ana ekrandaki yana kaydırmalı kart alanı (duyuru panosu ve iş kısayolu).
 * Müşteri uygulamasındaki CampaignSlider kalıbı: kart boyu bulunduğu alana göre ölçülür,
 * birden fazla kartta noktalar çıkar; istenirse kendiliğinden kayar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing } from '../../theme/design';

const CARD_GAP = spacing.sm;
const DOTS_HEIGHT = 20;
const PADDING_TOP = spacing.sm;
const AUTO_SCROLL_INTERVAL = 5000;

export interface CarouselCardSize {
  width: number;
  height: number;
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
  const [area, setArea] = useState<CarouselCardSize | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const multiple = items.length > 1;
  const cardWidth = area ? area.width - spacing.md * 2 : 0;
  // Ölçülen yükseklik üst boşluğu da içerir; altta noktalar (tek kartta küçük pay)
  const cardHeight = area ? area.height - PADDING_TOP - (multiple ? DOTS_HEIGHT : spacing.sm) : 0;
  const interval = cardWidth + CARD_GAP;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  // Yenilemede kart azaldıysa başa dön
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [items.length, activeIndex]);

  useEffect(() => {
    if (!autoScroll || !multiple || dragging || !isFocused || interval <= 0) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * interval, animated: true });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [autoScroll, multiple, dragging, isFocused, interval, activeIndex, items.length]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (interval <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / interval);
      if (index >= 0 && index < items.length) setActiveIndex((prev) => (prev === index ? prev : index));
    },
    [interval, items.length],
  );

  const size = { width: cardWidth, height: cardHeight };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {area && cardWidth > 0 && cardHeight > 0 && (
        <>
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
            style={{ height: cardHeight, flexGrow: 0 }}
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
        </>
      )}
    </View>
  );
}

function Separator() {
  return <View style={{ width: CARD_GAP }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: PADDING_TOP,
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
