import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Bell, ChevronRight, Info, Coffee } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CustomerHomeScreen({ route }) {
  const { user, restaurantName } = route.params;

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER - Local PNG Logo */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.notifButton}>
          <Bell color="#000" size={24} strokeWidth={1.5} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 2. LOYALTY CARD - With Lucide Coffee Cups */}
        <View style={styles.loyaltyCard}>
          <View style={styles.levelSidebar}>
            <Text style={styles.sidebarLabel}>your level</Text>
            {/* Main Level Icon */}
            <Coffee size={48} color="#000" strokeWidth={1.5} />
            <Text style={styles.levelName}>BLACK DIAMOND</Text>
          </View>

          <View style={styles.pointsArea}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceText}>0,00 TL</Text>
              <Info size={18} color="#000" />
            </View>
            <Text style={styles.balanceSub}>SPENT AT {restaurantName.toUpperCase()}</Text>

            {/* Coffee Cups Progress (Big to Small) */}
            <View style={styles.cupProgressRow}>
               <Coffee size={32} color="#000" strokeWidth={2} />
               <Coffee size={26} color="#444" strokeWidth={1.5} />
               <Coffee size={20} color="#888" strokeWidth={1.5} />
               <Coffee size={16} color="#AAA" strokeWidth={1} />
            </View>

            {/* Progress Bar Slider */}
            <View style={styles.progressBarBg}>
               <View style={[styles.progressFill, { width: '35%' }]} />
               <View style={styles.progressHandle} />
            </View>

            <View style={styles.pointsFooter}>
              <Text style={styles.pointsValue}>{user.membership_points || 0} POINTS</Text>
              <TouchableOpacity>
                <Text style={styles.collectLink}>How to collect?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. PROMOTIONS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promotions & News</Text>
          <ChevronRight color="#000" size={24} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingLeft: 20 }}
          snapToInterval={width * 0.75 + 15}
          decelerationRate="fast"
        >
         {/* Promo Card 2 */}
          <TouchableOpacity style={styles.promoCard}>
            <View style={[styles.promoImage, { backgroundColor: '#E8E8E8' }]}>
               <Coffee size={60} color="#000" strokeWidth={1} />
            </View>
            <Text style={styles.promoBrand}>Summer Blend</Text>
            <Text style={styles.promoSub}>Try our new selection</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 140,
    height: 40,
  },
  notifButton: { padding: 5, left: 310 },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    backgroundColor: '#FF4444',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FDFBEB'
  },
  loyaltyCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderWidth: 1.5, 
    borderColor: '#000',
    marginHorizontal: 20,
    height: 210,
    borderRadius: 4,
    overflow: 'hidden'
  },
  levelSidebar: { 
    flex: 1.1, 
    backgroundColor: '#F8F8F8', 
    borderRightWidth: 1.5, 
    borderColor: '#000',
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 10
  },
  sidebarLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  levelName: { fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  
  pointsArea: { flex: 2, padding: 15, justifyContent: 'space-between' },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceText: { fontSize: 24, fontWeight: '900' },
  balanceSub: { fontSize: 10, fontWeight: '700', color: '#666', marginBottom: 5 },
  
  cupProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 },
  progressBarBg: { height: 3, backgroundColor: '#EEE', width: '100%', position: 'relative', marginVertical: 10 },
  progressFill: { height: 3, backgroundColor: '#000' },
  progressHandle: { 
    position: 'absolute', 
    left: '35%', 
    top: -5, 
    width: 12, 
    height: 12, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#000',
    borderRadius: 6
  },

  pointsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsValue: { fontSize: 16, fontWeight: '900' },
  collectLink: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginTop: 30, 
    marginBottom: 15 
  },
  sectionTitle: { fontSize: 22, fontWeight: '900' },

  promoCard: { width: width * 0.75, marginRight: 15 },
  promoImage: { 
    height: 180, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    borderRadius: 4, 
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  promoBrand: { fontSize: 18, fontWeight: '900' },
  promoSub: { fontSize: 14, color: '#666', fontWeight: '500' },
  visaBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#0033A0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  visaText: { color: '#FFF', fontWeight: '900', fontSize: 10 }
});