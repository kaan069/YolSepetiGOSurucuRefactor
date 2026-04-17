import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GuideStep } from './guideSteps';

interface Props {
  step: GuideStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  arrowDirection: 'up' | 'down' | 'left' | 'right';
}

export default function GuideTooltip({ step, currentStep, totalSteps, onNext, onSkip, arrowDirection }: Props) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={styles.container}>
      {/* Yukari ok */}
      {arrowDirection === 'up' && <View style={[styles.arrow, styles.arrowUp]} />}

      {/* Sol ok */}
      {arrowDirection === 'left' && (
        <View style={styles.leftArrowRow}>
          <View style={[styles.arrow, styles.arrowLeft]} />
          <View style={styles.tooltipBody}>
            <TooltipContent
              step={step}
              currentStep={currentStep}
              totalSteps={totalSteps}
              isLastStep={isLastStep}
              onNext={onNext}
              onSkip={onSkip}
            />
          </View>
        </View>
      )}

      {/* Sag ok */}
      {arrowDirection === 'right' && (
        <View style={styles.leftArrowRow}>
          <View style={styles.tooltipBody}>
            <TooltipContent
              step={step}
              currentStep={currentStep}
              totalSteps={totalSteps}
              isLastStep={isLastStep}
              onNext={onNext}
              onSkip={onSkip}
            />
          </View>
          <View style={[styles.arrow, styles.arrowRight]} />
        </View>
      )}

      {/* Normal (up/down) body */}
      {(arrowDirection === 'up' || arrowDirection === 'down') && (
        <View style={styles.tooltipBody}>
          <TooltipContent
            step={step}
            currentStep={currentStep}
            totalSteps={totalSteps}
            isLastStep={isLastStep}
            onNext={onNext}
            onSkip={onSkip}
          />
        </View>
      )}

      {/* Asagi ok */}
      {arrowDirection === 'down' && <View style={[styles.arrow, styles.arrowDown]} />}
    </View>
  );
}

function TooltipContent({ step, currentStep, totalSteps, isLastStep, onNext, onSkip }: {
  step: GuideStep;
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      {/* Icon + Baslik */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={step.icon} size={24} color="#26a69a" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.stepIndicator}>{currentStep + 1} / {totalSteps}</Text>
        </View>
      </View>

      {/* Aciklama */}
      <Text style={styles.description}>{step.description}</Text>

      {/* Butonlar */}
      <View style={styles.buttons}>
        {!isLastStep && (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onNext} style={styles.nextButton}>
          <Text style={styles.nextText}>{isLastStep ? 'Tamamla' : 'Ileri'}</Text>
          {!isLastStep && (
            <MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  leftArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipBody: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 320,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26a69a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 4,
  },
  nextText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Ok stilleri
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  arrowUp: {
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    marginBottom: -1,
  },
  arrowDown: {
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  arrowLeft: {
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#ffffff',
    marginRight: -1,
  },
  arrowRight: {
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
    marginLeft: -1,
  },
});
