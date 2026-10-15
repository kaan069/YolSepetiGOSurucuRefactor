import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  FkButton,
  FkDocumentUpload,
  FkFormSection,
  FkIconChip,
  FkInfoBanner,
} from '../../components/fk';
import VehicleStatusChip from '../../components/common/VehicleStatusChip';
import BasicInfoCard from './editVehicle/components/BasicInfoCard';
import CraneFieldsCard from './editVehicle/components/CraneFieldsCard';
import HomeMovingFieldsCard from './editVehicle/components/HomeMovingFieldsCard';
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
import { documentVerifier } from '../../utils/documentCheck';

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
    setVehiclePhotoUri,
    setInsurancePhotoUri,
    replaceInteriorPhotos,
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

  const verificationStatus = 'verificationStatus' in vehicle ? vehicle.verificationStatus : undefined;
  const rejectionReason =
    'verificationRejectionReason' in vehicle ? vehicle.verificationRejectionReason : undefined;
  // Onaylı araç salt okunur: backend güncellemede onayı sıfırlamadığı için uygulamadan değiştirilemez
  const readOnly = verificationStatus === 'approved';

  const showPhoto = VEHICLE_KINDS_WITH_PHOTO.includes(vehicleType);
  const showInsurance = VEHICLE_KINDS_WITH_INSURANCE.includes(vehicleType);
  const transferType = (formData as Partial<TransferVehicleInfo>).transferType;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title={readOnly ? 'Araç Detayı' : 'Aracı Düzenle'} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <FkIconChip icon={VEHICLE_KIND_ICONS[vehicleType]} size={56} shape="circle" />
          <Text variant="headlineMedium" style={styles.title}>
            {readOnly ? 'Araç Detayı' : 'Aracı Düzenle'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {formData.plate} - {VEHICLE_KIND_LABELS[vehicleType]} Aracı
          </Text>
          <VehicleStatusChip status={verificationStatus} rejectionReason={rejectionReason} />
        </View>

        {readOnly && (
          <FkInfoBanner
            type="success"
            icon="check-decagram-outline"
            message="Bu araç onaylandı. Bilgilerini değiştirmek için destek ekibiyle iletişime geçin."
            style={styles.banner}
          />
        )}

        <BasicInfoCard formData={formData} errors={errors} updateField={updateField} readOnly={readOnly} />

        {showPhoto && (
          <FkFormSection title={`${VEHICLE_KIND_LABELS[vehicleType]} Fotoğrafı`} icon="camera-outline" required>
            <FkDocumentUpload
              helperText="Plaka görünür şekilde araç fotoğrafı ekleyin"
              value={vehiclePhoto}
              onChange={setVehiclePhotoUri}
              loading={loadingPhoto}
              verify={documentVerifier('vehicle_photo')}
              disabled={readOnly}
              imageQuality={0.8}
            />
          </FkFormSection>
        )}

        {showInsurance && (
          <FkFormSection title="Sigorta Belgesi" required>
            <FkDocumentUpload
              helperText="Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin"
              value={insurancePhoto}
              onChange={setInsurancePhotoUri}
              verify={documentVerifier('vehicle_insurance')}
              disabled={readOnly}
              imageQuality={0.8}
            />
          </FkFormSection>
        )}

        {vehicleType === 'tow' && (
          <TowTruckFieldsCard
            formData={formData}
            updateField={updateField}
            toggleSupportedVehicleType={toggleSupportedVehicleType}
            readOnly={readOnly}
          />
        )}

        {vehicleType === 'crane' && (
          <CraneFieldsCard formData={formData} errors={errors} updateField={updateField} readOnly={readOnly} />
        )}

        {vehicleType === 'transfer' && (
          <TransferFieldsCard formData={formData} setFieldValue={setFieldValue} readOnly={readOnly} />
        )}

        {vehicleType === 'transfer' && transferType === 'vip' && (
          <TransferInteriorPhotosCard
            interiorPhotos={interiorPhotos}
            onChange={replaceInteriorPhotos}
            readOnly={readOnly}
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
            readOnly={readOnly}
          />
        )}

        {vehicleType === 'homeMoving' && (
          <HomeMovingFieldsCard formData={formData} updateField={updateField} readOnly={readOnly} />
        )}

        {!readOnly && (
          <View style={styles.buttonContainer}>
            <FkButton
              variant="secondary"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.button}
            >
              İptal
            </FkButton>
            <FkButton
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Güncelleniyor...' : 'Kaydet'}
            </FkButton>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 100 },
  titleContainer: { marginBottom: 24, alignItems: 'center', gap: 8 },
  title: { fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 20 },
  banner: { marginBottom: 16 },
  buttonContainer: { flexDirection: 'row', gap: 12, paddingBottom: 20, marginTop: 8 },
  button: { flex: 1 },
});
