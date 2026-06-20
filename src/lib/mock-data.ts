import type { BuyerType } from "@/lib/types";

export const countryCities: Record<string, string[]> = {
  Germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  "United States": ["Dallas", "Chicago", "Los Angeles", "Atlanta", "Seattle"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Leeds", "Bristol"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Nantes"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Bilbao", "Seville"],
  Italy: ["Milan", "Rome", "Turin", "Bologna", "Florence"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"],
};

export const buyerTypeLabels: Record<BuyerType, string> = {
  distributor: "Distributor",
  wholesaler: "Wholesaler",
  importer: "Importer",
  retailer: "Retailer",
  brand: "Brand",
  "project buyer": "Project Buyer",
};

export const companyPrefixes = [
  "Northline",
  "Brightway",
  "EuroTrade",
  "GlobalSource",
  "PrimeChannel",
  "MarketBridge",
  "Atlas",
  "Meridian",
  "Summit",
  "ClearPath",
  "Vista",
  "MetroLink",
];

export const contactFirstNames = [
  "Anna",
  "Mark",
  "Sofia",
  "Daniel",
  "Laura",
  "Victor",
  "Elena",
  "Chris",
  "Nora",
  "Hugo",
];

export const contactLastNames = [
  "Muller",
  "Smith",
  "Garcia",
  "Rossi",
  "Martin",
  "Brown",
  "Khan",
  "Fischer",
  "Wilson",
  "Lopez",
];

export const titlesByBuyerType: Record<BuyerType, string[]> = {
  distributor: ["Purchasing Director", "Channel Manager", "Category Manager"],
  wholesaler: ["Sourcing Manager", "Import Manager", "Buyer"],
  importer: ["Import Director", "Procurement Lead", "General Manager"],
  retailer: ["Merchandising Manager", "Retail Buyer", "Category Lead"],
  brand: ["Product Manager", "Supply Chain Manager", "Founder"],
  "project buyer": ["Project Procurement Manager", "Engineering Buyer", "Tender Manager"],
};

export const crmStages = [
  "新客户",
  "已触达",
  "已回复",
  "已询价",
  "已报价",
  "已样品",
  "已 PI",
  "已订单",
  "已成交",
  "已沉睡",
  "已流失",
];
