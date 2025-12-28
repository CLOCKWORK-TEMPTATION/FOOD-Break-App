/**
 * مكون تسميات الطعام
 * Food Labels Component - Displays dietary labels on menu items
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// أنواع التسميات
interface FoodLabel {
  type: string;
  text: string;
  textEn: string;
  icon: string;
  color: string;
  spicyLevel?: number;
}

interface AllergenInfo {
  contains: string[];
  mayContain: string[];
  crossContaminationRisk: boolean;
  warnings: string[];
}

interface FoodLabelsProps {
  labels: FoodLabel[];
  allergenInfo?: AllergenInfo;
  compact?: boolean;
  onPress?: () => void;
}

// مكون شارة التسمية
const LabelBadge: React.FC<{
  label: FoodLabel;
  compact?: boolean;
}> = ({ label, compact }) => {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${label.color}15`, borderColor: label.color },
        compact && styles.badgeCompact,
      ]}
    >
      <Text style={styles.badgeIcon}>{label.icon}</Text>
      {!compact && (
        <Text style={[styles.badgeText, { color: label.color }]}>
          {label.text}
        </Text>
      )}
    </View>
  );
};

// مكون تحذير الحساسية
const AllergenWarning: React.FC<{
  allergenInfo: AllergenInfo;
  onPress?: () => void;
}> = ({ allergenInfo, onPress }) => {
  const hasAllergens = allergenInfo.contains.length > 0;
  const hasMayContain = allergenInfo.mayContain.length > 0;
  const hasRisk = allergenInfo.crossContaminationRisk;

  if (!hasAllergens && !hasMayContain && !hasRisk) return null;

  return (
    <TouchableOpacity style={styles.allergenWarning} onPress={onPress}>
      <Ionicons name="warning" size={16} color="#F44336" />
      <Text style={styles.allergenWarningText}>
        {hasAllergens && `يحتوي: ${allergenInfo.contains.slice(0, 2).join('، ')}`}
        {hasAllergens && allergenInfo.contains.length > 2 && '...'}
      </Text>
      <Ionicons name="chevron-forward" size={14} color="#999" />
    </TouchableOpacity>
  );
};

// المكون الرئيسي
const FoodLabels: React.FC<FoodLabelsProps> = ({
  labels,
  allergenInfo,
  compact = false,
  onPress,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  if (labels.length === 0 && !allergenInfo) return null;

  const visibleLabels = compact ? labels.slice(0, 4) : labels;
  const hiddenCount = labels.length - visibleLabels.length;

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowDetails(true)}
        activeOpacity={0.7}
      >
        {/* Labels Row */}
        <View style={styles.labelsRow}>
          {visibleLabels.map((label, index) => (
            <LabelBadge key={index} label={label} compact={compact} />
          ))}
          {hiddenCount > 0 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreBadgeText}>+{hiddenCount}</Text>
            </View>
          )}
        </View>

        {/* Allergen Warning */}
        {allergenInfo && (
          <AllergenWarning
            allergenInfo={allergenInfo}
            onPress={() => setShowDetails(true)}
          />
        )}
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>معلومات غذائية</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* All Labels */}
            {labels.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>التسميات الغذائية</Text>
                <View style={styles.modalLabelsGrid}>
                  {labels.map((label, index) => (
                    <View key={index} style={styles.modalLabelItem}>
                      <Text style={styles.modalLabelIcon}>{label.icon}</Text>
                      <View>
                        <Text style={[styles.modalLabelText, { color: label.color }]}>
                          {label.text}
                        </Text>
                        <Text style={styles.modalLabelTextEn}>{label.textEn}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Allergen Info */}
            {allergenInfo && (
              <>
                {allergenInfo.contains.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.allergenHeader}>
                      <Ionicons name="alert-circle" size={20} color="#F44336" />
                      <Text style={[styles.modalSectionTitle, { color: '#F44336' }]}>
                        يحتوي على
                      </Text>
                    </View>
                    <View style={styles.allergenList}>
                      {allergenInfo.contains.map((item, index) => (
                        <View key={index} style={styles.allergenTag}>
                          <Text style={styles.allergenTagText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {allergenInfo.mayContain.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.allergenHeader}>
                      <Ionicons name="warning" size={20} color="#FF9800" />
                      <Text style={[styles.modalSectionTitle, { color: '#FF9800' }]}>
                        قد يحتوي على
                      </Text>
                    </View>
                    <View style={styles.allergenList}>
                      {allergenInfo.mayContain.map((item, index) => (
                        <View key={index} style={styles.mayContainTag}>
                          <Text style={styles.mayContainTagText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {allergenInfo.crossContaminationRisk && (
                  <View style={styles.riskWarning}>
                    <Ionicons name="information-circle" size={20} color="#1976D2" />
                    <Text style={styles.riskWarningText}>
                      قد يوجد خطر التلوث المتقاطع في المطبخ
                    </Text>
                  </View>
                )}

                {allergenInfo.warnings.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>تحذيرات إضافية</Text>
                    {allergenInfo.warnings.map((warning, index) => (
                      <Text key={index} style={styles.warningItem}>
                        • {warning}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// مكون تحذير عدم التوافق
export const IncompatibilityWarning: React.FC<{
  reasons: string[];
  severity: 'warning' | 'danger';
  onPress?: () => void;
}> = ({ reasons, severity, onPress }) => {
  const color = severity === 'danger' ? '#F44336' : '#FF9800';
  const bgColor = severity === 'danger' ? '#FFEBEE' : '#FFF3E0';
  const icon = severity === 'danger' ? 'close-circle' : 'warning';

  return (
    <TouchableOpacity
      style={[styles.incompatibilityWarning, { backgroundColor: bgColor }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={color} />
      <View style={styles.incompatibilityContent}>
        <Text style={[styles.incompatibilityTitle, { color }]}>
          {severity === 'danger' ? 'غير متوافق مع حميتك' : 'تحذير'}
        </Text>
        <Text style={styles.incompatibilityReason} numberOfLines={1}>
          {reasons.join('، ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// مكون شارة التحقق
export const VerifiedBadge: React.FC<{
  isVerified: boolean;
}> = ({ isVerified }) => {
  if (!isVerified) return null;

  return (
    <View style={styles.verifiedBadge}>
      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
      <Text style={styles.verifiedText}>معتمد</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  moreBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  allergenWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    gap: 6,
  },
  allergenWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#C62828',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalLabelsGrid: {
    gap: 12,
  },
  modalLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalLabelIcon: {
    fontSize: 24,
  },
  modalLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalLabelTextEn: {
    fontSize: 12,
    color: '#666',
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  allergenTagText: {
    fontSize: 13,
    color: '#C62828',
  },
  mayContainTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  mayContainTagText: {
    fontSize: 13,
    color: '#E65100',
  },
  riskWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  riskWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
  },
  warningItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  incompatibilityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  incompatibilityContent: {
    flex: 1,
  },
  incompatibilityTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  incompatibilityReason: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default FoodLabels;
