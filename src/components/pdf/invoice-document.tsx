import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Invoice, Entity } from '@/types';

interface Props {
  invoice: Invoice;
  origin: Entity;
  destination: Entity;
}

function createStyles(primaryColor: string) {
  return StyleSheet.create({
    page: {
      padding: 48,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#111827',
      backgroundColor: '#FFFFFF',
    },
    header: {
      backgroundColor: primaryColor,
      padding: 24,
      marginBottom: 28,
      borderRadius: 4,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 28,
      color: '#FFFFFF',
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 2,
    },
    headerMeta: {
      color: '#FFFFFF',
      fontSize: 10,
      textAlign: 'right',
    },
    headerMetaBold: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'right',
    },
    partiesRow: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 28,
    },
    partyBox: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      paddingBottom: 4,
      marginBottom: 8,
    },
    fieldRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    fieldLabel: {
      width: 100,
      fontFamily: 'Helvetica-Bold',
      color: '#6B7280',
      fontSize: 9,
    },
    fieldValue: {
      flex: 1,
      fontSize: 10,
    },
    // Line items table
    lineItemsBox: {
      marginBottom: 28,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: primaryColor,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 3,
      marginBottom: 2,
    },
    tableHeaderCell: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    tableRowAlt: {
      backgroundColor: '#F9FAFB',
    },
    colDescription: { flex: 1 },
    colQty:         { width: 60, textAlign: 'right' },
    colUnitPrice:   { width: 80, textAlign: 'right' },
    colTotal:       { width: 80, textAlign: 'right' },
    tableCell: {
      fontSize: 10,
      color: '#374151',
    },
    tableCellBold: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    // Totals
    totalsBox: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 28,
    },
    totalsInner: {
      width: 220,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    totalRowFinal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: primaryColor,
      borderRadius: 3,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 10,
      color: '#6B7280',
    },
    totalValue: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    totalLabelFinal: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    totalValueFinal: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    footer: {
      position: 'absolute',
      bottom: 32,
      left: 48,
      right: 48,
      textAlign: 'center',
      fontSize: 8,
      color: '#9CA3AF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingTop: 8,
    },
  });
}

function fmt(amount: number | string): string {
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(qty: number | string): string {
  const n = Number(qty);
  // Show up to 4 decimals, strip trailing zeros
  return n % 1 === 0 ? n.toFixed(0) : parseFloat(n.toFixed(4)).toString();
}

export function InvoiceDocument({ invoice, origin, destination }: Props) {
  const styles = createStyles(origin.primary_color);

  const quantity  = Number(invoice.quantity ?? 1);
  const unitPrice = Number(invoice.unit_price ?? invoice.amount);
  const total     = Number(invoice.amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>INVOICE</Text>
            <View>
              <Text style={styles.headerMetaBold}>{invoice.invoice_number}</Text>
              <Text style={styles.headerMeta}>Date: {invoice.date}</Text>
            </View>
          </View>
        </View>

        {/* ── From / To ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>
              {origin.name}
            </Text>
            {origin.bank_name && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Bank:</Text>
                <Text style={styles.fieldValue}>{origin.bank_name}</Text>
              </View>
            )}
            {origin.bank_address && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Bank Address:</Text>
                <Text style={styles.fieldValue}>{origin.bank_address}</Text>
              </View>
            )}
            {origin.aba_routing && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>ABA Routing:</Text>
                <Text style={styles.fieldValue}>{origin.aba_routing}</Text>
              </View>
            )}
            {origin.account_number && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Account #:</Text>
                <Text style={styles.fieldValue}>{origin.account_number}</Text>
              </View>
            )}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>
              {destination.name}
            </Text>
            {destination.bank_name && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Bank:</Text>
                <Text style={styles.fieldValue}>{destination.bank_name}</Text>
              </View>
            )}
            {destination.aba_routing && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>ABA Routing:</Text>
                <Text style={styles.fieldValue}>{destination.aba_routing}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View style={styles.lineItemsBox}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Single line item row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, styles.colDescription]}>
              {invoice.service_description}
            </Text>
            <Text style={[styles.tableCell, styles.colQty]}>{fmtQty(quantity)}</Text>
            <Text style={[styles.tableCell, styles.colUnitPrice]}>${fmt(unitPrice)}</Text>
            <Text style={[styles.tableCellBold, styles.colTotal]}>${fmt(quantity * unitPrice)}</Text>
          </View>
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${fmt(total)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL DUE</Text>
              <Text style={styles.totalValueFinal}>${fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Generated by InvoiceMe · {invoice.invoice_number}
        </Text>
      </Page>
    </Document>
  );
}
