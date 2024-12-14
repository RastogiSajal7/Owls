import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';
import EmergencyContacts from './EmergencyContacts';
import useEmergencyMessage from './SendEmergencyMessage';
import { useAppContext } from '../AppProvider';

const PanicScreen = () => {
  const { contacts, sosContacts, addSosContact, userDetails } = useAppContext();
  const { sendEmergencyMessage } = useEmergencyMessage(userDetails);

  // Use useRef for Animated.Value to persist across renders
  const scale = useRef(new Animated.Value(1)).current;

  const handleSoSPress = () => sendEmergencyMessage(sosContacts);

  // SOS button animation
  useEffect(() => {
    const animateButton = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    };

    animateButton();
  }, [scale]);

  return (
    <View style={styles.container}>
      {sosContacts.length === 5 ? (
        <Animated.View style={[styles.sosButton, { transform: [{ scale }] }]}>
          <TouchableOpacity onPress={handleSoSPress}>
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <EmergencyContacts
          contacts={contacts}
          sosContacts={sosContacts}
          addSosContact={addSosContact}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  sosButton: {
    backgroundColor: '#ff5252',
    height: 150,
    width: 150,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '35%',
    left: '35%',
  },
  sosButtonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
});

export default PanicScreen;
