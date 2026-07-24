export interface Client {
  id: string;
  clientType: 'INDIVIDUAL' | 'ORGANIZATION';
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  officeId?: string;
  office?: { officeName: string };
  email: string;
  phone: string;
  location?: string;
}

export interface Venue {
  id: string;
  venueName: string;
  capacity: number;
  physicalAddress: string;
}

export interface MenuCatalog {
  id: string;
  title: string;
  description: string;
  baseRate: string;
  isActive: boolean;
  menuItems: Array<{ item: { itemName: string; category: string } }>;
}

export interface ServiceType {
  id: string;
  serviceName: string;
}

export interface CatalogData {
  offices: Array<{ id: string; officeName: string }>;
  serviceTypes: ServiceType[];
  venues: Venue[];
  menus: MenuCatalog[];
}

export interface OrderStatus {
  id: string;
  statusName: string;
}

export interface OrderDay {
  id: string;
  eventDate: string;
  mealPeriods: Array<{
    id: string;
    menuId: string;
    pax: number;
    rate: string;
    menu: MenuCatalog;
  }>;
}

export interface OrderHistoryLog {
  id: string;
  orderId: string;
  fromStatusId: string;
  toStatusId: string;
  changedByUserId: string;
  remarks: string;
  createdAt: string;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
}

export interface Order {
  id: string;
  clientId: string;
  venueId?: string;
  customDeliveryAddress?: string;
  serviceTypeId: string;
  statusId: string;
  ingressTime?: string;
  egressTime?: string;
  grandTotal: string;
  pdfGeneratedFlag: boolean;
  pdfFilePath?: string;
  specialInstructions?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  venue?: Venue;
  serviceType: { serviceName: string };
  status: OrderStatus;
  orderDays: OrderDay[];
  history: OrderHistoryLog[];
}
