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

type InvoiceLayout = 'classic' | 'minimal' | 'sidebar' | 'compact';

function createStyles(primaryColor: string, layout: InvoiceLayout) {
  const base = {
    page: {
      padding: layout === 'compact' ? 32 : 48,
      fontFamily: 'Helvetica',
      fontSize: layout === 'compact' ? 9 : 10,
      color: '#111827',
      backgroundColor: '#FFFFFF',
    },
    fieldRow: { flexDirection: 'row' as const, marginBottom: 3 },
    fieldLabel: {
      width: 100,
      fontFamily: 'Helvetica-Bold',
      color: '#6B7280',
      fontSize: layout === 'compact' ? 8 : 9,
    },
    fieldValue: { flex: 1, fontSize: layout === 'compact' ? 9 : 10 },
    colDescription: { flex: 1 },
    colQty: { width: 60, textAlign: 'right' as const },
    colUnitPrice: { width: 80, textAlign: 'right' as const },
    colTotal: { width: 80, textAlign: 'right' as const },
    tableCell: { fontSize: layout === 'compact' ? 9 : 10, color: '#374151' },
    tableCellBold: {
      fontSize: layout === 'compact' ? 9 : 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
  };

  const stubSidebar = {
    mainRow: { flexDirection: 'row' as const },
    sidebar: { width: 0 },
    content: { flex: 1 },
  };

  if (layout === 'minimal') {
    return StyleSheet.create({
      ...base,
      ...stubSidebar,
      header: {
        borderBottomWidth: 2,
        borderBottomColor: primaryColor,
        paddingBottom: 16,
        marginBottom: 32,
      },
      headerRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'flex-start' },
      headerTitle: { fontSize: 24, color: primaryColor, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
      headerMeta: { color: '#6B7280', fontSize: 10, textAlign: 'right' as const },
      headerMetaBold: { color: '#111827', fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' as const },
      partiesRow: { flexDirection: 'row' as const, gap: 48, marginBottom: 36 },
      partyBox: { flex: 1 },
      sectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#6B7280',
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: 10,
      },
      lineItemsBox: { marginBottom: 32 },
      tableHeader: {
        flexDirection: 'row' as const,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 10,
        paddingHorizontal: 0,
      },
      tableHeaderCell: {
        color: '#6B7280',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      },
      tableRow: {
        flexDirection: 'row' as const,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      },
      totalsBox: { flexDirection: 'row' as const, justifyContent: 'flex-end', marginBottom: 0 },
      totalsInner: { width: 200 },
      totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 0 },
      totalRowFinal: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: primaryColor,
      },
      totalLabel: { fontSize: 10, color: '#6B7280' },
      totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' },
      totalLabelFinal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
      totalValueFinal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: primaryColor },
    });
  }

  if (layout === 'sidebar') {
    return StyleSheet.create({
      ...base,
      mainRow: { flexDirection: 'row' as const, gap: 32, marginBottom: 24 },
      sidebar: { width: 160, paddingRight: 24, borderRightWidth: 1, borderRightColor: '#E5E7EB' },
      content: { flex: 1 },
      header: { marginBottom: 20 },
      headerRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'flex-start' },
      headerTitle: { fontSize: 22, color: primaryColor, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
      headerMeta: { color: '#6B7280', fontSize: 9, textAlign: 'right' as const },
      headerMetaBold: { color: '#111827', fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'right' as const },
      sectionTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: primaryColor,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: 8,
      },
      partyBox: {},
      partiesRow: { flexDirection: 'column' as const, marginBottom: 24 },
      lineItemsBox: { marginBottom: 24 },
      tableHeader: {
        flexDirection: 'row' as const,
        backgroundColor: primaryColor,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 2,
      },
      tableHeaderCell: {
        color: '#FFFFFF',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      },
      tableRow: {
        flexDirection: 'row' as const,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      },
      totalsBox: { flexDirection: 'row' as const, justifyContent: 'flex-end', marginBottom: 0 },
      totalsInner: { width: 200 },
      totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 10 },
      totalRowFinal: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: primaryColor,
        borderRadius: 3,
        marginTop: 4,
      },
      totalLabel: { fontSize: 10, color: '#6B7280' },
      totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' },
      totalLabelFinal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
      totalValueFinal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
    });
  }

  if (layout === 'compact') {
    return StyleSheet.create({
      ...base,
      ...stubSidebar,
      header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      },
      headerRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center', width: '100%' },
      headerTitle: { fontSize: 18, color: primaryColor, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
      headerMeta: { color: '#6B7280', fontSize: 8, textAlign: 'right' as const },
      headerMetaBold: { color: '#111827', fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right' as const },
      partiesRow: { flexDirection: 'row' as const, gap: 16, marginBottom: 16 },
      partyBox: { flex: 1 },
      sectionTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: primaryColor,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        paddingBottom: 2,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: primaryColor,
      },
      lineItemsBox: { marginBottom: 16 },
      tableHeader: {
        flexDirection: 'row' as const,
        backgroundColor: primaryColor,
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginBottom: 2,
      },
      tableHeaderCell: {
        color: '#FFFFFF',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      },
      tableRow: {
        flexDirection: 'row' as const,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      },
      totalsBox: { flexDirection: 'row' as const, justifyContent: 'flex-end', marginBottom: 0 },
      totalsInner: { width: 180 },
      totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8 },
      totalRowFinal: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: primaryColor,
        borderRadius: 2,
        marginTop: 2,
      },
      totalLabel: { fontSize: 9, color: '#6B7280' },
      totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },
      totalLabelFinal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
      totalValueFinal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
    });
  }

  // Classic (default)
  return StyleSheet.create({
    ...base,
    ...stubSidebar,
    header: {
      backgroundColor: primaryColor,
      padding: 24,
      marginBottom: 28,
      borderRadius: 4,
    },
    headerRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
    headerMeta: { color: '#FFFFFF', fontSize: 10, textAlign: 'right' as const },
    headerMetaBold: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' as const },
    partiesRow: { flexDirection: 'row' as const, gap: 24, marginBottom: 28 },
    partyBox: { flex: 1 },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      paddingBottom: 4,
      marginBottom: 8,
    },
    lineItemsBox: { marginBottom: 28 },
    tableHeader: {
      flexDirection: 'row' as const,
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
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row' as const,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    totalsBox: { flexDirection: 'row' as const, justifyContent: 'flex-end', marginBottom: 28 },
    totalsInner: { width: 220 },
    totalRow: { flexDirection: 'row' as const, justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 10 },
    totalRowFinal: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: primaryColor,
      borderRadius: 3,
      marginTop: 4,
    },
    totalLabel: { fontSize: 10, color: '#6B7280' },
    totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' },
    totalLabelFinal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
    totalValueFinal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
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
  return n % 1 === 0 ? n.toFixed(0) : parseFloat(n.toFixed(4)).toString();
}

function FromBlock({ origin, styles }: { origin: Entity; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.partyBox}>
      <Text style={styles.sectionTitle}>From</Text>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>{origin.name}</Text>
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
  );
}

function BillToBlock({ destination, styles }: { destination: Entity; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.partyBox}>
      <Text style={styles.sectionTitle}>Bill To</Text>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>{destination.name}</Text>
      {destination.address && (
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Address:</Text>
          <Text style={styles.fieldValue}>{destination.address}</Text>
        </View>
      )}
      {destination.email && (
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email:</Text>
          <Text style={styles.fieldValue}>{destination.email}</Text>
        </View>
      )}
    </View>
  );
}

function LineItemsTable({
  invoice,
  styles,
  quantity,
  unitPrice,
}: {
  invoice: Invoice;
  styles: ReturnType<typeof createStyles>;
  quantity: number;
  unitPrice: number;
}) {
  return (
    <View style={styles.lineItemsBox}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
        <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>Unit Price</Text>
        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.tableCellBold, styles.colDescription]}>{invoice.service_description}</Text>
        <Text style={[styles.tableCell, styles.colQty]}>{fmtQty(quantity)}</Text>
        <Text style={[styles.tableCell, styles.colUnitPrice]}>${fmt(unitPrice)}</Text>
        <Text style={[styles.tableCellBold, styles.colTotal]}>${fmt(quantity * unitPrice)}</Text>
      </View>
    </View>
  );
}

function TotalsBlock({ total, styles }: { total: number; styles: ReturnType<typeof createStyles> }) {
  return (
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
  );
}

/** Renders a single invoice page. Can be used inside Document for single or multi-page PDFs. */
export function InvoicePageContent({ invoice, origin, destination }: Props) {
  const layout: InvoiceLayout = origin.invoice_layout ?? 'classic';
  const styles = createStyles(origin.primary_color, layout);

  const quantity = Number(invoice.quantity ?? 1);
  const unitPrice = Number(invoice.unit_price ?? invoice.amount);
  const total = Number(invoice.amount);

  // Sidebar layout: From in left sidebar, rest on right
  if (layout === 'sidebar') {
    return (
      <Page size="A4" style={styles.page}>
        <View style={styles.mainRow}>
          <View style={styles.sidebar}>
            <FromBlock origin={origin} styles={styles} />
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>INVOICE</Text>
                <View>
                  <Text style={styles.headerMetaBold}>{invoice.invoice_number}</Text>
                  <Text style={styles.headerMeta}>Date: {invoice.date}</Text>
                </View>
              </View>
            </View>
            <BillToBlock destination={destination} styles={styles} />
            <LineItemsTable invoice={invoice} styles={styles} quantity={quantity} unitPrice={unitPrice} />
            <TotalsBlock total={total} styles={styles} />
          </View>
        </View>
      </Page>
    );
  }

  // Classic, minimal, compact: standard flow
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>INVOICE</Text>
          <View>
            <Text style={styles.headerMetaBold}>{invoice.invoice_number}</Text>
            <Text style={styles.headerMeta}>Date: {invoice.date}</Text>
          </View>
        </View>
      </View>

      <View style={styles.partiesRow}>
        <FromBlock origin={origin} styles={styles} />
        <BillToBlock destination={destination} styles={styles} />
      </View>

      <LineItemsTable invoice={invoice} styles={styles} quantity={quantity} unitPrice={unitPrice} />
      <TotalsBlock total={total} styles={styles} />
    </Page>
  );
}

export function InvoiceDocument({ invoice, origin, destination }: Props) {
  return (
    <Document>
      <InvoicePageContent invoice={invoice} origin={origin} destination={destination} />
    </Document>
  );
}
