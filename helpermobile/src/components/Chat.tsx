// This component provides a mock chat interface for communication between driver and customer.
// Bu component, sürücü ve müşteri arasında iletişim için bir mock sohbet arayüzü sağlar.
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FkCard, FkButton } from './fk';
import { colors } from '../theme/design';

// Type definition for a single message.
// Tek bir mesaj için tip tanımı.
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'driver'; // To style messages differently. // Mesajları farklı şekilde şekillendirmek için.
  timestamp: Date;
}

// Initial mock messages to populate the chat window.
// Sohbet penceresini doldurmak için başlangıç mock mesajları.
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Merhaba, yoldayım geliyorum.',
    sender: 'driver',
    timestamp: new Date(Date.now() - 60000 * 2),
  },
  {
    id: '2',
    text: 'Tamamdır, bekliyorum.',
    sender: 'user',
    timestamp: new Date(Date.now() - 60000 * 1),
  },
];

export default function Chat() {
  // State to hold the list of messages.
  // Mesaj listesini tutan state.
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  // State for the text input field.
  // Metin giriş alanı için state.
  const [newMessage, setNewMessage] = useState('');

  // Handles sending a new message.
  // Yeni bir mesaj göndermeyi yönetir.
  const handleSend = () => {
    if (newMessage.trim().length === 0) return;
    const message: Message = {
      id: Math.random().toString(),
      text: newMessage,
      sender: 'driver', // In a real app, this would be the current user's role. // Gerçek bir uygulamada bu, mevcut kullanıcının rolü olurdu.
      timestamp: new Date(),
    };
    // Add the new message to the list (at the beginning for the inverted FlatList).
    // Yeni mesajı listeye ekle (ters çevrilmiş FlatList için başlangıca).
    setMessages((prevMessages) => [message, ...prevMessages]);
    setNewMessage('');
  };

  return (
    <FkCard style={styles.card} padding={0}>
      <View style={styles.content}>
        {/* ScrollView to show messages - compatible with parent ScrollView */}
        {/* Mesajları göstermek için ScrollView - üst ScrollView ile uyumlu */}
        <ScrollView
          style={styles.messagesList}
          nestedScrollEnabled={true}
        >
          {messages.slice().reverse().map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageContainer,
                // Apply different styles based on the sender.
                // Gönderene göre farklı stiller uygula.
                item.sender === 'driver' ? styles.driverMessage : styles.userMessage,
              ]}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesajınızı yazın..."
            mode="outlined"
            dense
          />
          <FkButton onPress={handleSend} style={styles.sendButton}>
            Gönder
          </FkButton>
        </View>
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  driverMessage: {
    backgroundColor: '#DCF8C6', // Light green for driver's messages.
    alignSelf: 'flex-end',
  },
  userMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    justifyContent: 'center',
  },
  messagesList: {
    maxHeight: 200,
  },
});
