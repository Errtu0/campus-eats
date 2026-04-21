import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, LayoutAnimation } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { LogOut, UserCircle, ChevronDown, ChevronUp, Settings, HelpCircle, Edit3, Save } from 'lucide-react-native';
import { AUTH_URL } from '../../../src/config';

export default function ProfileTab({ route, navigation }) {
  const { user } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    { q: "How do I start a session?", a: "Find an empty table, scan the QR code located on the table, and you'll be automatically joined to that session." },
    { q: "Can I split the bill with friends?", a: "Yes! Every person at the table can scan the same QR code. You can then select individual items in the cart to pay for yourself." },
    { q: "Where can I see my receipts?", a: "Your successful orders appear in the 'Reorder' tab, where you can also quickly buy your favorites again." },
  ];

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${AUTH_URL}/update-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username }),
      });
      if (res.ok) {
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (e) {
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* HEADER SECTION */}
      <View style={styles.profileHeader}>
        <UserCircle size={100} color="#000" strokeWidth={1.5} />
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput 
              style={styles.usernameInput} 
              value={username} 
              onChangeText={setUsername}
              autoFocus
            />
            <TouchableOpacity onPress={handleUpdateProfile}>
              <Save size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editRow}>
            <Text style={styles.userName}>{username}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Edit3 size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.userRole}>Customer Account #{user.id}</Text>
      </View>

      {/* SETTINGS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={20} color="#000" />
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        </View>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Payment Methods</Text>
          <ChevronDown size={18} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notification Preferences</Text>
          <ChevronDown size={18} color="#999" />
        </TouchableOpacity>
      </View>

      {/* FAQ SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HelpCircle size={20} color="#000" />
          <Text style={styles.sectionTitle}>HOW TO USE CAMPUS EATS</Text>
        </View>
        {faqs.map((faq, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.faqItem} 
            onPress={() => toggleFaq(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              {expandedFaq === index ? <ChevronUp size={18} color="#000" /> : <ChevronDown size={18} color="#000" />}
            </View>
            {expandedFaq === index && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* SIGN OUT */}
      <TouchableOpacity 
        style={[GLOBAL_STYLES.card, styles.logoutCard]}
        onPress={() => navigation.replace('Welcome')}
      >
        <LogOut color="red" size={24} strokeWidth={3} />
        <Text style={styles.logoutText}>SIGN OUT OF ACCOUNT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20 },
  profileHeader: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
  userName: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  usernameInput: { fontSize: 28, fontWeight: '900', borderBottomWidth: 3, borderColor: '#000', paddingHorizontal: 10, backgroundColor: '#fff' },
  userRole: { fontSize: 14, fontWeight: '700', color: '#666', marginTop: 5 },
  
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  
  settingItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', marginBottom: 10
  },
  settingText: { fontWeight: '700', fontSize: 16 },

  faqItem: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', marginBottom: 10, padding: 15 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontWeight: '900', fontSize: 14, flex: 1, marginRight: 10 },
  faqAnswer: { marginTop: 10, fontWeight: '600', color: '#444', fontSize: 13, lineHeight: 18 },

  logoutCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 15, justifyContent: 'center', 
    backgroundColor: '#FFF0F0', marginTop: 20, padding: 20 
  },
  logoutText: { fontWeight: '900', color: 'red', fontSize: 14, letterSpacing: 1 }
});