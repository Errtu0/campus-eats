import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, LayoutAnimation } from 'react-native';
import { COLORS } from '../../../src/styles/theme';
import { LogOut, UserCircle, ChevronDown, ChevronUp, Settings, HelpCircle, Edit3, Save, Lock } from 'lucide-react-native'; // 🚀 Added Lock icon
import { AUTH_URL } from '../../../src/config';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function ProfileTab({ route, navigation }) {
  const { user } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // 🚀 GUEST GUARD PROTECTION INTERCEPTOR OVERLAY
  if (user?.is_guest) {
    return (
      <View style={styles.lockOverlayContainer}>
        <View style={styles.lockCardWrapper}>
          <View style={styles.lockCardInner}>
            <View style={styles.lockIconCircle}>
              <Lock size={40} color="#000" strokeWidth={2.5} />
            </View>
            <Text style={styles.lockTitle}>MEMBER ACCESS ONLY</Text>
            <Text style={styles.lockSubtitle}>
              GUEST PROFILES ARE EPHEMERAL. RE-ROUTE TO THE AUTHENTICATION PORTAL TO UNLOCK LOYALTY CARD WALLETS.
            </Text>
            
            <TouchableOpacity 
              style={styles.signInButton}
              activeOpacity={0.9}
              onPress={async () => {
                await AsyncStorage.multiRemove(['userToken', 'userData', 'active_session']);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }}
            >
              <Text style={styles.signInButtonText}>SIGN IN TO UNLOCK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const faqs = [
    { q: "HOW DO I START A SESSION?", a: "Find an empty table, scan the QR code located on the table, and you'll be automatically joined to that session." },
    { q: "CAN I SPLIT THE BILL WITH FRIENDS?", a: "Yes! Every person at the table can scan the same QR code. You can then select individual items in the cart to pay for yourself." },
    { q: "WHERE CAN I SEE MY RECEIPTS?", a: "Your successful orders appear in the 'Reorder' tab, where you can also quickly buy your favorites again." },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData', 'active_session']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) return Alert.alert("ERROR", "Username cannot be empty.");
    try {
      const token = await AsyncStorage.getItem('userToken');

      const res = await fetch(`${AUTH_URL}/update-profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditing(false);
        Alert.alert("SUCCESS", "Profile updated successfully!");
      } else {
        Alert.alert("DENIED", data.error || "Failed to alter account parameters.");
      }
    } catch (e) {
      Alert.alert("ERROR", "Could not update profile.");
    }
  };

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* HEADER SECTION */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarBorder}>
          <UserCircle size={90} color="#000" strokeWidth={1.5} />
        </View>
        
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput 
              style={styles.usernameInput} 
              value={username} 
              onChangeText={setUsername}
              autoCapitalize="characters"
              autoFocus
              maxLength={16}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
              <Save size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editRow}>
            <Text style={styles.userName}>{username.toUpperCase()}</Text>
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setIsEditing(true)}>
              <Edit3 size={16} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.userRole}>CAMPUS ACCOUNT ID #{user.id}</Text>
      </View>

      {/* SETTINGS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        </View>
        
        <View style={styles.neomorphicCardWrapper}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>PAYMENT METHODS</Text>
            <ChevronDown size={18} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.neomorphicCardWrapper}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>NOTIFICATION PREFERENCES</Text>
            <ChevronDown size={18} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HelpCircle size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>HOW TO USE CAMPUS EATS</Text>
        </View>
        
        {faqs.map((faq, index) => (
          <View key={index} style={styles.neomorphicCardWrapper}>
            <TouchableOpacity 
              style={styles.faqItem} 
              onPress={() => toggleFaq(index)}
              activeOpacity={0.9}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                {expandedFaq === index ? <ChevronUp size={18} color="#000" strokeWidth={2.5} /> : <ChevronDown size={18} color="#000" strokeWidth={2.5} />}
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* SIGN OUT ACTION CARD */}
      <View style={styles.logoutCardWrapper}>
        <TouchableOpacity 
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <LogOut color="#fff" size={20} strokeWidth={3} />
          <Text style={styles.logoutText}>SIGN OUT OF ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', paddingHorizontal: 20 },
  profileHeader: { alignItems: 'center', marginTop: 60, marginBottom: 35 },
  avatarBorder: {
    padding: 4,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15, justifyContent: 'center', width: '100%' },
  userName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: '#000' },
  editIconBtn: {
    backgroundColor: '#fff',
    padding: 6,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
  },
  usernameInput: { 
    fontSize: 20, 
    fontWeight: '900', 
    borderWidth: 3, 
    borderColor: '#000', 
    paddingHorizontal: 12, 
    paddingVertical: 6,
    backgroundColor: '#fff',
    minWidth: 180,
    textAlign: 'center'
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
  },
  userRole: { fontSize: 11, fontWeight: '800', color: '#777', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, color: '#000' },
  neomorphicCardWrapper: { backgroundColor: '#000', borderWidth: 2, borderColor: '#000', marginBottom: 12 },
  settingItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#000',
    transform: [{ translateX: -3 }, { translateY: -3 }]
  },
  settingText: { fontWeight: '900', fontSize: 13, color: '#000' },
  faqItem: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#000', padding: 16,
    transform: [{ translateX: -3 }, { translateY: -3 }]
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontWeight: '900', fontSize: 13, flex: 1, marginRight: 10, color: '#000' },
  faqAnswer: { marginTop: 12, fontWeight: '700', color: '#555', fontSize: 12, lineHeight: 16, borderTopWidth: 2, borderTopColor: '#eee', paddingTop: 10 },
  logoutCardWrapper: { backgroundColor: '#000', borderWidth: 3, borderColor: '#000', marginTop: 15 },
  logoutCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', 
    backgroundColor: COLORS.primary, padding: 16, borderWidth: 1, borderColor: '#000',
    transform: [{ translateX: -4 }, { translateY: -4 }]
  },
  logoutText: { fontWeight: '900', color: '#fff', fontSize: 13, letterSpacing: 0.5 },

  // 🚀 INJECTED GUEST CONTROL SCREEN OVERLAY STYLES
  lockOverlayContainer: { flex: 1, backgroundColor: '#FDFBEB', justifyContent: 'center', alignItems: 'center', padding: 25 },
  lockCardWrapper: { backgroundColor: '#000', borderWidth: 4, borderColor: '#000', width: '100%', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 8 },
  lockCardInner: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000', padding: 30, alignItems: 'center', transform: [{ translateX: -6 }, { translateY: -6 }] },
  lockIconCircle: { padding: 18, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#000', marginBottom: 20 },
  lockTitle: { fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  lockSubtitle: { fontSize: 11, fontWeight: '700', color: '#666', lineHeight: 16, textAlign: 'center', marginBottom: 25, textTransform: 'uppercase' },
  signInButton: { width: '100%', backgroundColor: COLORS.secondary, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 2 },
  signInButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }
});