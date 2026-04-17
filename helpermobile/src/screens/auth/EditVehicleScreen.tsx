import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import BasicInfoCard from './editVehicle/components/BasicInfoCard';
import CraneFieldsCard from './editVehicle/components/CraneFieldsCard';
import HomeMovingFieldsCard from './editVehicle/components/HomeMovingFieldsCard';
import PhotoPicker from './editVehicle/components/PhotoPicker';
import TowTruckFieldsCard from './editVehicle/components/TowTruckFieldsCard';
import TransferDocumentsCard from './editVehicle/components/TransferDocumentsCard';
import TransferFieldsCard from './editVehicle/components/TransferFieldsCard';
import TransferInteriorPhotosCard from './editVehicle/components/TransferInteriorPhotosCard';
import TransportFieldsCard from './editVehicle/components/TransportFieldsCard';
import VehicleNotFound from './editVehicle/components/VehicleNotFound';
import {
  VEHICLE_KINDS_WITH_INSURANCE,
  VEHICLE_KINDS_WITH_PHOTO,
  VEHICLE_KIND_ICONS,
  VEHICLE_KIND_LABELS,
} from './editVehicle/constants';
import { useEditVehicleForm } from './editVehicle/useEditVehicleForm';
import { useUpdateVehicle } from './editVehicle/useUpdateVehicle';
import { useVehiclePhotos } from './editVehicle/useVehiclePhotos';
import { TransferVehicleInfo } from '../../store/useVehicleStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EditVehicle'>;

export default function EditVehicleScreen({ route, navigation }: Props) {
  const { screenBg } = useAppTheme();
  const { vehicleId, vehicleType } = route.params;

  const {
    vehicle,
    formData,
    errors,
    updateField,
    setFieldValue,
    toggleSupportedVehicleType,
    validateForm,
  } = useEditVehicleForm(vehicleId, vehicleType);

  const {
    vehiclePhoto,
    insurancePhoto,
    interiorPhotos,
    transferDocuments,
    loadingPhoto,
    pickVehicleFromGallery,
    pickVehicleFromCamera,
    pickInsuranceFromGallery,
    pickInsuranceFromCamera,
    pickDocumentFor,
    removeVehiclePhoto,
    removeInsurancePhoto,
    pickInteriorPhoto,
    removeInteriorPhoto,
  } = useVehiclePhotos(vehicle?.id, vehicleType);

  const { loading, handleSave } = useUpdateVehicle({
    vehicle,
    vehicleType,
    validateForm,
    formData,
    vehiclePhoto,
    insurancePhoto,
    interiorPhotos,
    onSuccess: () => navigation.goBack(),
  });

  if (!vehicle) {
    return <VehicleNotFound onBack={() => navigation.goBack()} />;
  }

  const showPhoto = VEHICLE_KINDS_WITH_PHOTO.includes(vehicleType);
  const showInsurance = VEHICLE_KINDS_WITH_INSURANCE.includes(vehicleType);
  const transferType = (formData as Partial<TransferVehicleInfo>).transferType;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title="Aracı Düzenle" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            {VEHICLE_KIND_ICONS[vehicleType]} Aracı Düzenle
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {formData.plate} - {VEHICLE_KIND_LABELS[vehicleType]} Aracı
          </Text>
        </View>

        <BasicInfoCard formData={formData} errors={errors} updateField={updateField} />

        {showPhoto && (
          <PhotoPicker
            title={`📷 ${VEHICLE_KIND_LABELS[vehicleType]} Fotoğrafı`}
            helperText="Plaka görünür şekilde araç fotoğrafı ekleyin"
            photoUri={vehiclePhoto}
            loading={loadingPhoto}
            onPickCamera={pickVehicleFromCamera}
            onPickGallery={pickVehicleFromGallery}
            onPickDocument={() => pickDocumentFor('vehicle')}
            onRemove={removeVehiclePhoto}
            replaceMode="gallery"
          />
        )}

        {showInsurance && (
          <PhotoPicker
            title="Sigorta Belgesi (Opsiyonel)"
            helperText="Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin"
            photoUri={insurancePhoto}
            onPickCamera={pickInsuranceFromCamera}
            onPickGallery={pickInsuranceFromGallery}
            onPickDocument={() => pickDocumentFor('insurance')}
            onRemove={removeInsurancePhoto}
            replaceMode="document"
          />
        )}

        {vehicleType === 'tow' && (
          <TowTruckFieldsCard
            formData={formData}
            updateField={updateField}
            toggleSupportedVehicleType={toggleSupportedVehicleType}
          />
        )}

        {vehicleType === 'crane' && (
          <CraneFieldsCard formData={formData} errors={errors} updateField={updateField} />
        )}

        {vehicleType === 'transfer' && (
          <TransferFieldsCard formData={formData} setFieldValue={setFieldValue} />
        )}

        {vehicleType === 'transfer' && transferType === 'vip' && (
          <TransferInteriorPhotosCard
            interiorPhotos={interiorPhotos}
            onPickPhoto={pickInteriorPhoto}
            onRemovePhoto={removeInteriorPhoto}
          />
        )}

        {vehicleType === 'transfer' && (
          <TransferDocumentsCard transferDocuments={transferDocuments} />
        )}

        {vehicleType === 'transport' && (
          <TransportFieldsCard
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        )}

        {vehicleType === 'homeMoving' && (
          <HomeMovingFieldsCard formData={formData} updateField={updateField} />
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Güncelleniyor...' : 'Kaydet'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
  cancelButton: {
    borderColor: '#666',
  },
});
