import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal, FlatList } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { QrCode, Utensils, MapPin, X, Navigation, Users, GraduationCap ,ChevronRight} from 'lucide-react-native';
import { RESTAURANT_URL } from '../../../src/config';

export default function HomeTab({ route, navigation }) {
  const { user, restaurantId, restaurantName } = route.params;
  const [storesModal, setStoresModal] = useState(false);
  const [otherStores, setOtherStores] = useState([]);

  // Mock data for loyalty - we can link this to DB later
  const loyaltyPoints = 450;
  const nextLevel = 1000;
  const progress = (loyaltyPoints / nextLevel) * 100;

  const fetchOtherStores = async () => {
    try {
      const res = await fetch(`${RESTAURANT_URL}/network/${restaurantId}`);
      const data = await res.json();
      setOtherStores(data);
      setStoresModal(true);
    } catch (e) {
      console.error("Store Fetch Error", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* LOGO HEADER */}
        <View style={styles.topHeader}>
          <Text style={styles.logoText}>{restaurantName}</Text>
        </View>

        {/* LOYALTY CARD (The "Level" box from your image) */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyLeft}>
            <Text style={styles.levelLabel}>YOUR LEVEL</Text>
            <GraduationCap size={60} color="#000" strokeWidth={1} />
            <Text style={styles.levelName}>SOPHOMORE</Text>
          </View>
          
          <View style={styles.loyaltyRight}>
            <Text style={styles.spentAmount}>450 <Text style={styles.currency}>PTS</Text></Text>
            <Text style={styles.spentLabel}>COLLECTED THIS SEMESTER</Text>
            
            {/* Custom Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.progressMarker} />
            </View>
            
            <View style={styles.pointsRow}>
              <Text style={styles.pointsSub}>{loyaltyPoints} POINTS</Text>
              <TouchableOpacity>
                <Text style={styles.howToText}>How to earn?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS GRID */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Scan')}>
            <QrCode size={30} color="#000" />
            <Text style={styles.actionLabel}>Scan & Join</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Tables')}>
            <Utensils size={30} color="#000" />
            <Text style={styles.actionLabel}>View Tables</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBox} onPress={fetchOtherStores}>
            <MapPin size={30} color="#000" />
            <Text style={styles.actionLabel}>Our Stores</Text>
          </TouchableOpacity>
        </View>

        {/* PROMOTIONS & NEWS SECTION */}
        <View style={styles.promoHeader}>
          <Text style={styles.sectionTitle}>PROMOTIONS & NEWS</Text>
          <ChevronRight size={24} color="#000" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
          {/* Promo Card 1 */}
          <View style={styles.promoCard}>
            <View style={styles.promoImagePlaceholder}>
               <Text style={styles.discountText}>-20%</Text>
            </View>
            <View style={styles.promoInfo}>
              <Text style={styles.promoTitle}>Exam Season Fuel</Text>
              <Text style={styles.promoSub}>Discount on all double espressos until Friday.</Text>
            </View>
          </View>

          {/* Promo Card 2 */}
          <View style={styles.promoCard}>
            <View style={[styles.promoImagePlaceholder, {backgroundColor: COLORS.secondary}]}>
               <Text style={styles.discountText}>FREE</Text>
            </View>
            <View style={styles.promoInfo}>
              <Text style={styles.promoTitle}>Freshman Bonus</Text>
              <Text style={styles.promoSub}>Get your first muffin free on your first order.</Text>
            </View>
          </View>
        </ScrollView>

      </ScrollView>
      <Modal visible={storesModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>OUR CAMPUS STORES</Text>
              <TouchableOpacity onPress={() => setStoresModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={otherStores}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.storeCard}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.storeAddress}>{item.address || 'Campus Central'}</Text>
                    
                    <View style={styles.densityTag}>
                      <Users size={12} color="#666" />
                      <Text style={styles.densityText}>
                        {item.current_occupancy || 0} People Dining
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.navBtn}>
                    <Navigation size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No other branches found.</Text>
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
  topHeader: { padding: 20, paddingTop: 10, alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  
  loyaltyCard: { 
    flexDirection: 'row', backgroundColor: '#fff', margin: 20, 
    borderWidth: 3, borderColor: '#000', height: 180,
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 5
  },
  loyaltyLeft: { 
    width: '40%', borderRightWidth: 3, borderColor: '#000', 
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' 
  },
  levelLabel: { position: 'absolute', top: 0, left: 0, backgroundColor: '#444', color: '#fff', fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2 },
  levelName: { fontWeight: '900', fontSize: 14, marginTop: 10 },
  
  loyaltyRight: { flex: 1, padding: 15, justifyContent: 'center' },
  spentAmount: { fontSize: 28, fontWeight: '900' },
  currency: { fontSize: 14, color: '#666' },
  spentLabel: { fontSize: 9, fontWeight: '800', color: '#666', marginBottom: 20 },
  
  progressContainer: { marginTop: 10 },
  progressBarBg: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  progressMarker: { width: 12, height: 12, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', position: 'absolute', top: -3, left: '40%' },
  
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  pointsSub: { fontSize: 12, fontWeight: '900' },
  howToText: { fontSize: 12, fontWeight: '900', textDecorationLine: 'underline' },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  actionBox: { 
    width: '31%', height: 100, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center', gap: 8
  },
  actionLabel: { fontSize: 12, fontWeight: '900' },

  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  
  promoScroll: { paddingLeft: 20, marginTop: 15 },
  promoCard: { width: 280, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', marginRight: 15, marginBottom: 10 },
  promoImagePlaceholder: { height: 140, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderColor: '#000' },
  discountText: { fontSize: 40, fontWeight: '900', color: '#fff' },
  promoInfo: { padding: 15 },
  promoTitle: { fontSize: 16, fontWeight: '900' },
  promoSub: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FDFBEB',
    borderTopWidth: 5,
    borderColor: '#000',
    height: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 4
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 18, fontWeight: '900' },
  storeAddress: { fontSize: 12, color: '#666', fontWeight: '600', marginVertical: 4 },
  densityTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  densityText: { fontSize: 11, fontWeight: '700', color: '#666' },
  navBtn: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#fff'
  },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '700', color: '#999' }
});