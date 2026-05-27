import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal, FlatList } from 'react-native';
import { COLORS } from '../../../src/styles/theme';
import { QrCode, Utensils, MapPin, X, Navigation, Users, GraduationCap, ChevronRight, Info, RefreshCw, Megaphone } from 'lucide-react-native';
import { RESTAURANT_URL } from '../../../src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeTab({ route, navigation }) {
  const { user, restaurantId, restaurantName } = route.params;
  const [storesModal, setStoresModal] = useState(false);
  const [howToModal, setHowToModal] = useState(false);
  const [otherStores, setOtherStores] = useState([]);
  
  // Dynamic state container for our processed bulletin feed rows
  const [newsFeed, setNewsFeed] = useState([]);

  const loyaltyPoints = user.membership_points || 0;
  const nextLevel = 1000;
  const progress = Math.min((loyaltyPoints / nextLevel) * 100, 100);

  // FIX: Read straight from local AsyncStorage logs continuously to preserve high performance frames
  const loadCachedBulletins = async () => {
    try {
      const rawNews = await AsyncStorage.getItem(`news_${restaurantId}`);
      if (rawNews) {
        setNewsFeed(JSON.parse(rawNews));
      }
    } catch (err) {
      console.log("Failed reading from async disk lines context properties.");
    }
  };

  useEffect(() => {
    loadCachedBulletins();
    
    // Add navigation focus listener hook to force update items every time student returns to panel screen spaces
    const unsubscribe = navigation.addListener('focus', () => {
      loadCachedBulletins();
    });
    
    return unsubscribe;
  }, [navigation, restaurantId]);

  const fetchOtherStores = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${RESTAURANT_URL}/network/${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setOtherStores(Array.isArray(data) ? data : []);
      setStoresModal(true);
    } catch (e) {
      console.error("Store Fetch Error", e);
    }
  };

  const handleSwitchBranch = () => {
    navigation.replace('RestaurantPicker', { user });
  };

  const InstructionStep = ({ title, desc, index }) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepImagePlaceholder}>
        <Text style={styles.stepNumber}>{index}</Text>
        <Info size={32} color="#000" />
      </View>
      <View style={styles.stepTextContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* HEADER BLOCK WRAPPER */}
        <View style={styles.brandHeader}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandSub}>CURRENT LOCATION</Text>
              <Text style={styles.brandName}>{restaurantName.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.switchBranchBtn} onPress={handleSwitchBranch}>
              <RefreshCw color="#000" size={18} strokeWidth={2.5} />
              <Text style={styles.switchBranchText}>CHANGE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LOYALTY CARD BLOCK */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyLeft}>
            <Text style={styles.levelLabel}>STATUS</Text>
            <GraduationCap size={50} color="#000" strokeWidth={1.5} />
            <Text style={styles.levelName}>{loyaltyPoints >= 500 ? 'SENIOR' : 'FRESHMAN'}</Text>
          </View>
          
          <View style={styles.loyaltyRight}>
            <Text style={styles.spentAmount}>{loyaltyPoints} <Text style={styles.currency}>PTS</Text></Text>
            <Text style={styles.spentLabel}>TOTAL CAMPUS CREDIT</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
            </View>
            
            <View style={styles.pointsRow}>
              <Text style={styles.pointsSub}>
                {loyaltyPoints >= nextLevel ? "MAX LEVEL ACHIEVED" : `${nextLevel - loyaltyPoints} PTS TO NEXT LEVEL`}
              </Text>
              <TouchableOpacity onPress={() => setHowToModal(true)}>
                <Text style={styles.howToText}>How to earn?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* QUICK CONTROL MATRIX GRID ACTIONS */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Scan')}>
            <QrCode size={28} color="#000" />
            <Text style={styles.actionLabel}>SCAN & JOIN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Tables')}>
            <Utensils size={28} color="#000" />
            <Text style={styles.actionLabel}>VIEW MAP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBox} onPress={fetchOtherStores}>
            <MapPin size={28} color="#000" />
            <Text style={styles.actionLabel}>STORES</Text>
          </TouchableOpacity>
        </View>

        {/* HERO CAROUSEL ROW */}
        <View style={styles.promoHeader}>
          <Text style={styles.sectionTitle}>CAMPUS ANNOUNCEMENTS</Text>
          <ChevronRight size={24} color="#000" />
        </View>

        {/* CAROUSEL CONTROLLER */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.carouselWrapper} 
          style={styles.promoScroll}
        >
          {newsFeed.length === 0 ? (
            <View style={styles.promoCardBlank}>
              <Text style={styles.blankPromoText}>OFFERS REFRESH EVERY SEMESTER</Text>
              <Text style={styles.blankPromoSubtext}>Check back once admin portal deployments go live.</Text>
            </View>
          ) : (
            newsFeed.map((story) => (
              <View key={story.id} style={styles.newsTactileCard}>
                <View style={styles.newsHeaderBadge}>
                  <Megaphone size={10} color="#fff" />
                  <Text style={styles.badgeLabelText}>CAMPUS BULLETIN BROADCAST</Text>
                </View>
                <Text style={styles.newsTitleHeading} numberOfLines={1}>{story.title.toUpperCase()}</Text>
                <Text style={styles.newsDescriptionText} numberOfLines={3}>{story.description}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>

      {/* HOW TO EARN MODAL */}
      <Modal visible={howToModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>HOW TO EARN POINTS</Text>
              <TouchableOpacity onPress={() => setHowToModal(false)}>
                <X size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <InstructionStep index="1" title="Scan Table QR Code" desc="Locate the custom CampusEats code matrix fixed on your table surface and focus your lens to initialize." />
              <InstructionStep index="2" title="Select Menu & Checkout" desc="Assemble choices onto the live dynamic session card. For every $1 spent, you earn exactly 10 digital validation points." />
              <InstructionStep index="3" title="Instant Balance Increase" desc="Upon processing payment, our backend updates inventory records and refreshes your status tier profile in real-time." />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OUR STORES MODAL */}
      <Modal visible={storesModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>OTHER BRANCHES</Text>
              <TouchableOpacity onPress={() => setStoresModal(false)}>
                <X size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={otherStores}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.storeCard}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.storeAddress}>{item.address || 'University Campus Complex'}</Text>
                    <View style={styles.densityTag}>
                      <Users size={12} color="#666" />
                      <Text style={styles.densityText}>{item.current_occupancy || 0} People Dining</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.navBtn}>
                    <Navigation size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>NO OTHER SIS-BRANCHES FOUND</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  brandHeader: { backgroundColor: COLORS.primary, padding: 25, paddingTop: 50, borderBottomWidth: 4, borderColor: '#000', marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandSub: { color: '#fff', fontSize: 10, fontWeight: '900', opacity: 0.8 },
  brandName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  switchBranchBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 2 },
  switchBranchText: { fontSize: 10, fontWeight: '900', color: '#000' },
  loyaltyCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 10, borderWidth: 3, borderColor: '#000', height: 160, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 5 },
  loyaltyLeft: { width: '35%', borderRightWidth: 3, borderColor: '#000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F8' },
  levelLabel: { position: 'absolute', top: 0, left: 0, backgroundColor: '#000', color: '#fff', fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2 },
  levelName: { fontWeight: '900', fontSize: 12, marginTop: 8, textTransform: 'uppercase' },
  loyaltyRight: { flex: 1, padding: 15, justifyContent: 'center' },
  spentAmount: { fontSize: 32, fontWeight: '900' },
  currency: { fontSize: 14, fontWeight: '700', color: '#666' },
  spentLabel: { fontSize: 10, fontWeight: '800', color: '#999', marginBottom: 15 },
  progressContainer: { marginTop: 5 },
  progressBarBg: { height: 10, backgroundColor: '#eee', borderWidth: 2, borderColor: '#000' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  pointsSub: { fontSize: 10, fontWeight: '900', color: '#666' },
  howToText: { fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: COLORS.secondary },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  actionBox: { width: '31%', height: 90, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 2 },
  actionLabel: { fontSize: 10, fontWeight: '900' },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  promoScroll: { marginTop: 15 },
  carouselWrapper: { paddingLeft: 20, paddingRight: 20, gap: 15 },
  promoCardBlank: { width: 335, height: 125, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 15 },
  blankPromoText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1, textAlign: 'center' },
  blankPromoSubtext: { color: '#666', fontWeight: '700', fontSize: 10, marginTop: 5, textAlign: 'center', textTransform: 'uppercase' },
  newsTactileCard: { width: 350, height: 200, backgroundColor: '#FCE4D6', borderWidth: 3, borderColor: '#000', padding: 16, shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 3 },
  newsHeaderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  badgeLabelText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.2 },
  newsTitleHeading: { fontSize: 14, fontWeight: '900', color: '#000', marginBottom: 4, letterSpacing: -0.2 },
  newsDescriptionText: { fontSize: 11, fontWeight: '700', color: '#333', lineHeight: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FDFBEB', borderTopWidth: 5, borderColor: '#000', height: '60%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  stepContainer: { flexDirection: 'row', marginBottom: 25, alignItems: 'center' },
  stepImagePlaceholder: { width: 70, height: 70, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1 },
  stepNumber: { position: 'absolute', top: -8, left: -8, backgroundColor: '#000', color: '#fff', width: 22, height: 22, lineHeight: 20, textAlign: 'center', fontWeight: '900', fontSize: 12, borderWidth: 1, borderColor: '#fff' },
  stepTextContent: { flex: 1, marginLeft: 15 },
  stepTitle: { fontWeight: '900', fontSize: 15 },
  stepDesc: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 4, lineHeight: 16 },
  storeCard: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '900' },
  storeAddress: { fontSize: 11, color: '#666', marginVertical: 3 },
  densityTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  densityText: { fontSize: 11, fontWeight: '700', color: '#666' },
  navBtn: { backgroundColor: '#000', padding: 10, borderWidth: 1, borderColor: '#fff' },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontWeight: '900', color: '#999', letterSpacing: 1 }
});