import React, { useRef, useCallback, useState } from 'react';
import { View, FlatList, Animated, StyleSheet, Dimensions, TouchableOpacity, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OnboardingSlide from './components/OnboardingSlide';
import OnboardingPagination from './components/OnboardingPagination';
import { onboardingSlides, OnboardingSlideData } from './data/onboardingSlides';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  // Direct props (ilk giris - RootNavigator'dan dogrudan render)
  isModal?: boolean;
  onDismiss?: () => void;
  // Navigation props (modal tekrar izle - AppStack'ten navigate)
  navigation?: any;
  route?: any;
}

export default function OnboardingScreen({ isModal: isModalProp, onDismiss, navigation, route }: Props) {
  // Modal durumunu belirle: dogrudan prop veya route param
  const isModal = isModalProp || route?.params?.isModal || false;

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<OnboardingSlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleComplete = useCallback(() => {
    if (isModal) {
      // Modal modda: geri don
      if (onDismiss) {
        onDismiss();
      } else if (navigation) {
        navigation.goBack();
      }
    } else {
      // Ilk giris modda: onboarding'i tamamla
      useOnboardingStore.getState().completeOnboarding();
    }
  }, [isModal, onDismiss, navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const renderItem = useCallback(({ item, index }: { item: OnboardingSlideData; index: number }) => (
    <OnboardingSlide slide={item} index={index} scrollX={scrollX} />
  ), [scrollX]);

  const keyExtractor = useCallback((item: OnboardingSlideData) => item.id, []);

  const handleDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss();
    } else if (navigation) {
      navigation.goBack();
    }
  }, [onDismiss, navigation]);

  return (
    <View style={styles.container}>
      {/* Modal kapatma butonu */}
      {isModal && (
        <SafeAreaView edges={['top']} style={styles.closeButtonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <OnboardingPagination
        scrollX={scrollX}
        currentIndex={currentIndex}
        onNext={handleNext}
        onSkip={handleSkip}
        onDone={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00695c',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
