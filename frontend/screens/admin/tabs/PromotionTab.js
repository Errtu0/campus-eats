import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Switch, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Ticket, Trash2, Megaphone, Newspaper } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

export default function PromotionTab({ restaurantId, data, newsFeed, refresh }) {
  const [activeSegment, setActiveSegment] = useState('COUPONS');
  const [modalVisible, setModalVisible] = useState(false);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  
  // Coupon Generation State Management
  const [form, setForm] = useState({ 
    code: '', 
    discount_value: '', 
    coupon_type: 'PERCENT', 
    min_cart_limit: '',
    applicable_to: 'ALL'
  });

  // Newsletter Broadcasting State Management
  const [newsForm, setNewsForm] = useState({ title: '', description: '', image_tag: 'default' });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: null });

  const showTabAlert = (title, message, onConfirm = null) => {
    setModalVisible(false);
    setNewsModalVisible(false);
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      return showTabAlert("MISSING FIELDS", "Please provide both a code and a discount value.");
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          code: form.code.trim().toUpperCase(), 
          discount_value: parseFloat(form.discount_value), 
          restaurant_id: restaurantId,
          coupon_type: form.coupon_type,
          min_cart_limit: form.min_cart_limit ? parseFloat(form.min_cart_limit) : 0.0,
          applicable_to: form.applicable_to
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        setForm({ code: '', discount_value: '', coupon_type: 'PERCENT', min_cart_limit: '', applicable_to: 'ALL' });
        refresh();
        showTabAlert("SUCCESS", "Promo rule framework compiled successfully.");
      } else {
        if (responseData.error === "PROMO_CODE_ALREADY_EXISTS") {
          showTabAlert("DUPLICATE CODE", "This code name is already active.");
        } else {
          showTabAlert("DENIED", responseData.error || "Failed to finalize coupon setup.");
        }
      }
    } catch (e) { 
      showTabAlert("OFFLINE", "Server connection timed out."); 
    }
  };

  const handlePublishNews = async () => {
    if (!newsForm.title.trim() || !newsForm.description.trim()) {
      return showTabAlert("MISSING INFO", "Please supply both header titles and summary descriptions.");
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ADMIN_URL}/news-feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newsForm.title.trim(),
          description: newsForm.description.trim(),
          restaurant_id: restaurantId,
          image_tag: newsForm.image_tag
        })
      });

      if (response.ok) {
        setNewsForm({ title: '', description: '', image_tag: 'default' });
        refresh();
        showTabAlert("SUCCESS", "Newsletter item broadcasted dynamically to campus dashboards!");
      }
    } catch (e) {
      showTabAlert("OFFLINE", "Communications network sync lost.");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) refresh();
    } catch (e) { 
      showTabAlert("ERROR", "Could not update status.");
    }
  };

  const confirmDelete = (id, type) => {
    if (type === 'COUPON') {
      showTabAlert("DELETE PROMO", "This clears the promo rules forever. Are you sure?", () => performDeleteCoupon(id));
    } else {
      showTabAlert("REMOVE BULLETIN", "Delete this news item from customer home feeds?", () => performDeleteNews(id));
    }
  };

  const performDeleteCoupon = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setAlertVisible(false); refresh(); }
    } catch (e) { showTabAlert("ERROR", "Server operation aborted."); }
  };

  const performDeleteNews = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // FIX: Attached authorization headers token parameter block to allow successful admin processing execution paths
      const res = await fetch(`${ADMIN_URL}/news-feed/${id}`, { 
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) { setAlertVisible(false); refresh(); }
    } catch (e) { showTabAlert("ERROR", "Bulletin deletion request failed."); }
  };

  return (
    <View style={styles.tabContainer}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false);
          const activeTitle = alertConfig.title ? alertConfig.title.toUpperCase() : '';
          
          if (
            activeTitle !== "SUCCESS" && 
            activeTitle !== "DELETE PROMO" && 
            activeTitle !== "REMOVE BULLETIN"
          ) {
            if (
              activeTitle.includes("FIELDS") || 
              activeTitle.includes("LIMIT") || 
              activeTitle.includes("DENIED") || 
              activeTitle.includes("DUPLICATE")
            ) {
              setModalVisible(true);
            } else if (activeTitle.includes("INFO")) {
              setNewsModalVisible(true);
            }
          }
        }}
        onConfirm={alertConfig.onConfirm}
      />

      <View style={styles.segmentWrapper}>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'COUPONS' && styles.activeSegmentBtn]} onPress={() => setActiveSegment('COUPONS')}>
          <Text style={[styles.segmentText, activeSegment === 'COUPONS' && styles.activeSegmentText]}>COUPONS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'NEWS' && styles.activeSegmentBtn]} onPress={() => setActiveSegment('NEWS')}>
          <Text style={[styles.segmentText, activeSegment === 'NEWS' && styles.activeSegmentText]}>LIVE DISPATCHES</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeSegment === 'COUPONS' ? data : (newsFeed || [])}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[GLOBAL_STYLES.card, activeSegment === 'COUPONS' && !item.is_active && { opacity: 0.5 }, { marginBottom: 15 }]}>
            <View style={styles.itemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={styles.iconCircle}>
                  {activeSegment === 'COUPONS' ? <Ticket size={22} color={COLORS.secondary} /> : <Newspaper size={20} color={COLORS.primary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{activeSegment === 'COUPONS' ? item.code : item.title}</Text>
                  <Text style={activeSegment === 'COUPONS' ? styles.discountText : styles.newsItemDesc} numberOfLines={2}>
                    {activeSegment === 'COUPONS' 
                      ? (item.coupon_type === 'PERCENT' ? `${item.discount_value}% OFF` : `$${item.discount_value.toFixed(2)} OFF`)
                      : item.description}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {activeSegment === 'COUPONS' && (
                  <Switch 
                    value={item.is_active} 
                    onValueChange={() => toggleStatus(item.id, item.is_active)}
                    trackColor={{ false: "#ccc", true: COLORS.primary }}
                    thumbColor="#fff"
                  />
                )}
                <TouchableOpacity onPress={() => confirmDelete(item.id, activeSegment === 'COUPONS' ? 'COUPON' : 'NEWS')}>
                  <Trash2 size={18} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No registered updates running inside this module.</Text>}
      />

      <View style={styles.fixedBtnContainer}>
        <TouchableOpacity style={[styles.fixedAddBtn, { backgroundColor: COLORS.secondary }]} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
          <PlusCircle color="#fff" size={16} />
          <Text style={[styles.addBtnText, { color: '#fff' }]}>+ COUPON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fixedAddBtn, { backgroundColor: COLORS.primary }]} onPress={() => setNewsModalVisible(true)} activeOpacity={0.9}>
          <Megaphone color="#fff" size={16} />
          <Text style={[styles.addBtnText, { color: '#fff' }]}>+ NEWS DISPATCH</Text>
        </TouchableOpacity>
      </View>

      {/* RE-RENDERED PROMO MODAL ARCHITECTURE */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>CREATE PROMO</Text>
              
              <Text style={styles.label}>PROMO CODE</Text>
              <TextInput placeholder="CAMPUS20" placeholderTextColor="#777" style={styles.input} autoCapitalize="characters" value={form.code} onChangeText={t => setForm({...form, code: t.toUpperCase()})} />

              <Text style={styles.label}>DISCOUNT TIER TYPE</Text>
              <View style={styles.toggleGroup}>
                <TouchableOpacity style={[styles.toggleOption, form.coupon_type === 'PERCENT' && styles.activeToggle]} onPress={() => setForm({...form, coupon_type: 'PERCENT'})}>
                  <Text style={[styles.toggleText, form.coupon_type === 'PERCENT' && styles.activeToggleText]}>PERCENTAGE (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleOption, form.coupon_type === 'FIXED_AMOUNT' && styles.activeToggle]} onPress={() => setForm({...form, coupon_type: 'FIXED_AMOUNT'})}>
                  <Text style={[styles.toggleText, form.coupon_type === 'FIXED_AMOUNT' && styles.activeToggleText]}>VALUE MATCH ($)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>VALUE (RATE OR DOLLAR OFF)</Text>
              <TextInput placeholder={form.coupon_type === 'PERCENT' ? "e.g. 15" : "e.g. 5.00"} placeholderTextColor="#777" keyboardType="numeric" style={styles.input} value={form.discount_value} onChangeText={t => setForm({...form, discount_value: t})} />

              <Text style={styles.label}>MINIMUM ORDER SPEND LIMIT (OPTIONAL)</Text>
              <TextInput placeholder="e.g. 15.00" placeholderTextColor="#777" keyboardType="numeric" style={styles.input} value={form.min_cart_limit} onChangeText={t => setForm({...form, min_cart_limit: t})} />

              <Text style={styles.label}>PRODUCT SELECTION</Text>
              <View style={styles.selectorGrid}>
                {['ALL', 'COFFEE', 'BURGERS', 'SNACKS', 'DRINKS'].map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.selectorChip, form.applicable_to === cat && styles.activeChip]} onPress={() => setForm({...form, applicable_to: cat})}>
                    <Text style={[styles.chipText, form.applicable_to === cat && styles.activeChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* FIX: RENDER TEXT COLOR WRAPPERS INSIDE THE NEOBRUTALIST ACTION COMPONENT */}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>ACTIVATE PROMO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BULLETIN MODAL */}
      <Modal visible={newsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>BROADCAST</Text>
              <Text style={styles.label}>ANNOUNCEMENT TITLE</Text>
              <TextInput placeholder="e.g. Free Muffin Friday!" placeholderTextColor="#777" style={styles.input} value={newsForm.title} onChangeText={t => setNewsForm({...newsForm, title: t})} />
              <Text style={styles.label}>CONTENT DETAILS</Text>
              <TextInput placeholder="Details text content here..." placeholderTextColor="#777" multiline numberOfLines={4} style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={newsForm.description} onChangeText={t => setNewsForm({...newsForm, description: t})} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={handlePublishNews}><Text style={styles.saveBtnText}>LAUNCH BROADCAST</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setNewsModalVisible(false)} style={{ marginTop: 15 }}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: '#FDFBEB' },
  segmentWrapper: { flexDirection: 'row', borderBottomWidth: 3, borderColor: '#000', backgroundColor: '#fff' },
  segmentBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  activeSegmentBtn: { backgroundColor: '#000' },
  segmentText: { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  activeSegmentText: { color: '#fff' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  itemName: { fontWeight: '900', fontSize: 15, textTransform: 'uppercase', color: '#000' },
  discountText: { fontWeight: '900', color: COLORS.primary, fontSize: 13, marginTop: 1 },
  newsItemDesc: { fontSize: 11, fontWeight: '700', color: '#555', marginTop: 2 },
  fixedBtnContainer: { position: 'absolute', bottom: 75, left: 15, right: 15, flexDirection: 'row', gap: 10 },
  fixedAddBtn: { flex: 1, height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  addBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center', color: '#000' },
  label: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 6 },
  input: { borderWidth: 3, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '800', fontSize: 13, color: '#000' },
  saveBtn: { padding: 14, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }, // Locked to bold white layout specs
  cancelText: { textAlign: 'center', fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 60, fontWeight: '900', color: '#ccc' },
  toggleGroup: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toggleOption: { flex: 1, height: 40, borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  activeToggle: { backgroundColor: '#000' },
  toggleText: { fontSize: 10, fontWeight: '900', color: '#000' },
  activeToggleText: { color: '#fff' },
  selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  selectorChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  activeChip: { backgroundColor: '#000' },
  chipText: { fontSize: 9, fontWeight: '900', color: '#000' },
  activeChipText: { color: '#fff' }
});