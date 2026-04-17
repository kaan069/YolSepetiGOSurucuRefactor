import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    registerForPushNotificationsAsync,
    setupForegroundNotificationHandler,
    onNotificationOpenedApp,
    getInitialNotification,
} from "../lib/notifications";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import authAPI from "../api/auth";
import { navigateToAcceptedJob } from "../utils/notificationNavigation";

const FCM_TOKEN_KEY = "fcm_token";

/**
 * Custom hook for managing push notifications with Firebase
 * Firebase ile push bildirimleri yönetimi için özel hook
 *
 * Bu hook:
 * - ✅ Emulator'de çalışır!
 * - ✅ SDK 53+ destekler!
 * - ✅ Direkt FCM token alır!
 * - Kullanıcı giriş yaptıktan sonra FCM token'ı alır
 * - Token'ı AsyncStorage'da saklar
 * - Token'ı backend'e gönderir
 * - Gelen bildirimleri dinler ve in-app banner gösterir
 * - Bildirime tıklandığında yönlendirme yapar
 */
export function useNotifications(navigationRef?: any) {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<
        Notifications.Notification | undefined
    >();
    const [showBanner, setShowBanner] = useState(false);
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const foregroundUnsubscribe = useRef<(() => void) | null>(null);
    const openedAppUnsubscribe = useRef<(() => void) | null>(null);
    const { currentUser, isAuthenticated } = useAuthStore();
    const { setFcmToken, addNotification } = useNotificationStore();
    const [isTokenSent, setIsTokenSent] = useState(false);

    // Kullanıcı giriş yaptığında FCM token'ı al ve gönder
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id) {
            // Giriş yapılmadıysa hiçbir şey yapma
            setIsTokenSent(false);
            return;
        }

        // Eğer token zaten gönderildiyse, tekrar gönderme
        if (isTokenSent) return;

        const initializeNotifications = async () => {
            try {
                // İzin durumunu kontrol et
                const { status } = await Notifications.getPermissionsAsync();

                if (status !== 'granted') {
                    const token = await registerForPushNotificationsAsync();

                    if (token) {
                        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
                        setExpoPushToken(token);
                        setFcmToken(token);
                        await sendTokenToBackend(token, currentUser.id);
                        setIsTokenSent(true);
                    }
                    return;
                }

                // İzin varsa cached token'ı kontrol et
                const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

                if (cachedToken) {
                    setExpoPushToken(cachedToken);
                    setFcmToken(cachedToken);
                    await sendTokenToBackend(cachedToken, currentUser.id);
                    setIsTokenSent(true);
                } else {
                    const token = await registerForPushNotificationsAsync();

                    if (token) {
                        // Token'ı kaydet
                        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
                        setExpoPushToken(token);
                        setFcmToken(token);

                        // Backend'e gönder
                        await sendTokenToBackend(token, currentUser.id);
                        setIsTokenSent(true);
                    }
                }

                // Token yenileme dinleyicisi (sadece token yenilendiğinde tetiklenir)
                const unsubscribeTokenRefresh = messaging().onTokenRefresh(
                    async (newToken) => {
                        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
                        setExpoPushToken(newToken);
                        setFcmToken(newToken);
                        if (currentUser?.id) {
                            await sendTokenToBackend(newToken, currentUser.id);
                        }
                    }
                );

                return unsubscribeTokenRefresh;
            } catch (error) {
                console.error("❌ FCM token initialization hatası:", error);
            }
        };

        initializeNotifications();
    }, [isAuthenticated, currentUser?.id, isTokenSent, setFcmToken]);

    // Firebase foreground bildirim dinleyicisini aktif tut
    // Bu her zaman çalışmalı (authentication'dan bağımsız)
    useEffect(() => {
        foregroundUnsubscribe.current = setupForegroundNotificationHandler();

        // Expo Notifications dinleyicisi (foreground handler tarafından tetiklenir)
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                setNotification(notification);

                // In-app banner'ı göster
                setShowBanner(true);

                // Bildirim store'a ekle
                if (currentUser?.id) {
                    const notificationData = {
                        id: notification.request.identifier,
                        userId: currentUser.id,
                        type: (notification.request.content.data?.type ||
                            "system") as any,
                        title: notification.request.content.title || "",
                        body: notification.request.content.body || "",
                        data: notification.request.content.data,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                    };
                    addNotification(notificationData);
                }
            });

        // Expo Notifications tıklama dinleyicisi
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data;
                    if (data?.screen) {
                        // navigation.navigate(data.screen, data.params);
                    }
                }
            );

        // Firebase: Bildirimden uygulama açıldığında (background/quit state)
        openedAppUnsubscribe.current = onNotificationOpenedApp(
            async (remoteMessage) => {
                console.log('🍎🔔 [iOS-BG] Platform:', Platform.OS);
                console.log('🍎🔔 [iOS-BG] remoteMessage keys:', Object.keys(remoteMessage));
                console.log('🍎🔔 [iOS-BG] remoteMessage.data:', JSON.stringify(remoteMessage.data));
                console.log('🍎🔔 [iOS-BG] remoteMessage.notification:', JSON.stringify(remoteMessage.notification));

                if (currentUser?.id && remoteMessage.notification) {
                    const notificationData = {
                        id: remoteMessage.messageId || Date.now().toString(),
                        userId: currentUser.id,
                        type: (remoteMessage.data?.type || "system") as any,
                        title: remoteMessage.notification.title || "",
                        body: remoteMessage.notification.body || "",
                        data: remoteMessage.data,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                    };
                    addNotification(notificationData);
                }

                const data = remoteMessage.data;
                if (!data) {
                    console.error('🍎❌ [iOS-BG] DATA NULL! remoteMessage:', JSON.stringify(remoteMessage));
                    return;
                }

                // DEBUG: Her alan tek tek logla
                console.log('🍎🔔 [iOS-BG] data.type:', typeof data.type, data.type);
                console.log('🍎🔔 [iOS-BG] data.service_type:', typeof data.service_type, data.service_type);
                console.log('🍎🔔 [iOS-BG] data.request_details_id:', typeof data.request_details_id, data.request_details_id);
                console.log('🍎🔔 [iOS-BG] data.request_id:', typeof data.request_id, data.request_id);
                console.log('🍎🔔 [iOS-BG] data.orderId:', typeof data.orderId, data.orderId);
                console.log('🍎🔔 [iOS-BG] data.order_id:', typeof data.order_id, data.order_id);
                console.log('🍎🔔 [iOS-BG] data.requestId:', typeof data.requestId, data.requestId);

                const orderId = data.request_details_id || data.orderId || data.order_id || data.requestId || data.request_id;
                const serviceType = data.service_type || data.type || 'tow';
                const notificationType = data.type;

                console.log('🍎🔔 [iOS-BG] FINAL orderId:', typeof orderId, orderId);
                console.log('🍎🔔 [iOS-BG] FINAL serviceType:', serviceType);
                console.log('🍎🔔 [iOS-BG] FINAL notificationType:', notificationType);
                console.log('🍎🔔 [iOS-BG] navigationRef ready:', !!navigationRef?.current);

                if (navigationRef?.current) {
                    setTimeout(() => {
                        console.log('🍎🔔 [iOS-BG] setTimeout fired, navigating...');
                        if (notificationType === 'job_completed' || notificationType === 'request_completed') {
                            navigationRef.current.navigate('Tabs', { screen: 'EarningsTab' });
                        }
                        else if (notificationType === 'request_cancelled') {
                            navigationRef.current.navigate('Tabs', { screen: 'OrdersTab' });
                        }
                        else if ((notificationType === 'offer_accepted' || notificationType === 'request_approved') && orderId) {
                            navigateToAcceptedJob(navigationRef, orderId, serviceType, '[Background]');
                        }
                        else if (orderId) {
                            if (serviceType === 'crane' || serviceType === 'vinc_request') {
                                navigationRef.current.navigate('CraneOffer', { orderId: String(orderId) });
                            } else if (serviceType === 'home_moving' || serviceType === 'evden_eve') {
                                navigationRef.current.navigate('HomeMovingOffer', { orderId: String(orderId) });
                            } else if (serviceType === 'city_moving' || serviceType === 'sehirler_arasi') {
                                navigationRef.current.navigate('CityMovingOffer', { orderId: String(orderId) });
                            } else if (serviceType === 'road_assistance' || serviceType === 'yol_yardim' || serviceType === 'road_assistance_request') {
                                navigationRef.current.navigate('RoadAssistanceOffer', { orderId: String(orderId) });
                            } else if (serviceType === 'transfer' || serviceType === 'transfer_request') {
                                navigationRef.current.navigate('TransferOffer', { orderId: String(orderId) });
                            } else {
                                navigationRef.current.navigate('TowTruckOffer', { orderId: String(orderId) });
                            }
                        }
                    }, 500);
                } else {
                    try {
                        await AsyncStorage.setItem('pending_notification_navigation', JSON.stringify({
                            orderId: orderId,
                            serviceType: serviceType,
                            notificationType: notificationType,
                            timestamp: Date.now()
                        }));
                    } catch (error) {
                        console.error("❌ [Background] AsyncStorage kayıt hatası:", error);
                    }
                }
            }
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
            foregroundUnsubscribe.current?.();
            openedAppUnsubscribe.current?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Her zaman mount'ta kur, unmount'ta temizle

    // Uygulama kapalıyken tıklanan bildirim kontrolü (killed state)
    // Bu effect navigationRef ve currentUser hazır olduğunda çalışır
    useEffect(() => {
        if (!navigationRef?.current || !currentUser?.id) {
            return;
        }

        getInitialNotification().then((remoteMessage) => {
            if (remoteMessage && remoteMessage.notification) {
                console.log('🍎🔔 [iOS-KILLED] Platform:', Platform.OS);
                console.log('🍎🔔 [iOS-KILLED] remoteMessage keys:', Object.keys(remoteMessage));
                console.log('🍎🔔 [iOS-KILLED] remoteMessage.data:', JSON.stringify(remoteMessage.data));
                console.log('🍎🔔 [iOS-KILLED] remoteMessage.notification:', JSON.stringify(remoteMessage.notification));

                const notificationData = {
                    id: remoteMessage.messageId || Date.now().toString(),
                    userId: currentUser.id,
                    type: (remoteMessage.data?.type || "system") as any,
                    title: remoteMessage.notification.title || "",
                    body: remoteMessage.notification.body || "",
                    data: remoteMessage.data,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                };
                addNotification(notificationData);

                const data = remoteMessage.data;
                if (!data) {
                    console.error('🍎❌ [iOS-KILLED] DATA NULL! remoteMessage:', JSON.stringify(remoteMessage));
                    return;
                }

                // DEBUG: Her alan tek tek logla
                console.log('🍎🔔 [iOS-KILLED] data.type:', typeof data.type, data.type);
                console.log('🍎🔔 [iOS-KILLED] data.service_type:', typeof data.service_type, data.service_type);
                console.log('🍎🔔 [iOS-KILLED] data.request_details_id:', typeof data.request_details_id, data.request_details_id);
                console.log('🍎🔔 [iOS-KILLED] data.request_id:', typeof data.request_id, data.request_id);
                console.log('🍎🔔 [iOS-KILLED] data.orderId:', typeof data.orderId, data.orderId);
                console.log('🍎🔔 [iOS-KILLED] data.order_id:', typeof data.order_id, data.order_id);
                console.log('🍎🔔 [iOS-KILLED] data.requestId:', typeof data.requestId, data.requestId);

                const orderId = data.request_details_id || data.orderId || data.order_id || data.requestId || data.request_id;
                const serviceType = data.service_type || data.type || 'tow';
                const notificationType = data.type;

                console.log('🍎🔔 [iOS-KILLED] FINAL orderId:', typeof orderId, orderId);
                console.log('🍎🔔 [iOS-KILLED] FINAL serviceType:', serviceType);
                console.log('🍎🔔 [iOS-KILLED] FINAL notificationType:', notificationType);

                setTimeout(() => {
                    if (notificationType === 'job_completed' || notificationType === 'request_completed') {
                        navigationRef.current?.navigate('Tabs', { screen: 'EarningsTab' });
                    }
                    else if (notificationType === 'request_cancelled') {
                        navigationRef.current?.navigate('Tabs', { screen: 'OrdersTab' });
                    }
                    else if ((notificationType === 'offer_accepted' || notificationType === 'request_approved') && orderId) {
                        navigateToAcceptedJob(navigationRef, orderId, serviceType, '[Killed State]');
                    }
                    else if (orderId) {
                        if (serviceType === 'crane' || serviceType === 'vinc_request') {
                            navigationRef.current?.navigate('CraneOffer', { orderId: String(orderId) });
                        } else if (serviceType === 'home_moving' || serviceType === 'evden_eve') {
                            navigationRef.current?.navigate('HomeMovingOffer', { orderId: String(orderId) });
                        } else if (serviceType === 'city_moving' || serviceType === 'sehirler_arasi') {
                            navigationRef.current?.navigate('CityMovingOffer', { orderId: String(orderId) });
                        } else if (serviceType === 'road_assistance' || serviceType === 'yol_yardim' || serviceType === 'road_assistance_request') {
                            navigationRef.current?.navigate('RoadAssistanceOffer', { orderId: String(orderId) });
                        } else if (serviceType === 'transfer' || serviceType === 'transfer_request') {
                            navigationRef.current?.navigate('TransferOffer', { orderId: String(orderId) });
                        } else {
                            navigationRef.current?.navigate('TowTruckOffer', { orderId: String(orderId) });
                        }
                    }
                }, 1500);
            }
        }).catch((error) => {
            console.error("❌ [Killed State] getInitialNotification hatası:", error);
        });
    }, [navigationRef?.current, currentUser?.id, addNotification]);

    // Uygulama açılışında eski pending navigation verisini temizle
    // Bildirim tıklamaları getInitialNotification() ve onNotificationOpenedApp ile zaten çalışıyor
    useEffect(() => {
        AsyncStorage.removeItem('pending_notification_navigation').catch(() => { });
    }, []);

    // Çıkış yapıldığında token gönderim durumunu sıfırla
    useEffect(() => {
        if (!isAuthenticated) {
            setIsTokenSent(false);
        }
    }, [isAuthenticated]);

    return {
        expoPushToken,
        notification,
        showBanner,
        setShowBanner,
    };
}

/**
 * Send FCM token to backend
 * FCM token'ı backend'e gönder
 */
async function sendTokenToBackend(
    token: string,
    userId: string
): Promise<void> {
    // Device ID'yi fonksiyon scope'unda tanımla (error bloğunda da kullanılacak)
    let deviceId: string | null = null;

    try {
        // Device ID'yi kalıcı olarak al veya oluştur
        deviceId = await AsyncStorage.getItem('@device_id');

        if (!deviceId) {
            deviceId = `device_${userId}_${Math.random().toString(36).substring(2, 15)}`;
            await AsyncStorage.setItem('@device_id', deviceId);
        }

        await authAPI.registerFCMToken({
            fcm_token: token,
            device_id: deviceId,
            device_type: Platform.OS as 'ios' | 'android',
        });

    } catch (error: any) {
        console.error("❌ FCM token backend'e gönderilemedi:", error?.message || error);
    }
}
