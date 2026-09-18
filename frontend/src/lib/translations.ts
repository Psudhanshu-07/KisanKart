export type Language = "en" | "hi" | "mr";

export const translations = {
  en: {
    brand: "KisanKart",
    tagline: "Fresh produce, direct from farm to buyer",
    exploreMarketplace: "Explore Marketplace",
    postRequirement: "Post a Requirement",
    demoMode: "Marketplace Live",
    dataSaver: "Data Saver Mode",
    roles: {
      farmer: "Farmer",
      fpo: "FPO",
      buyer: "Buyer",
      driver: "Driver / Logistics",
      admin: "Admin / Government"
    },
    nav: {
      home: "Home",
      marketplace: "Marketplace",
      farmerPortal: "Farmer Portal",
      buyerPortal: "Buyer Portal",
      fpoPortal: "FPO Hub",
      driverPortal: "Driver Route",
      adminPortal: "Intelligence",
      traceability: "Lot Traceability"
    },
    farmer: {
      sell: "Sell Produce",
      orders: "Active Orders",
      earnings: "Earnings & Realisation",
      demand: "Demand Forecast",
      voiceBtn: "Voice Listing (Mic)",
      listening: "Listening... speak now in Hindi, English, or Marathi",
      submitListing: "Confirm & Publish Listing",
      offlineNotice: "Offline Mode — Listing saved locally. Auto-syncing when online.",
      onlineSync: "Online — Local listings synced successfully ✓",
      realisedPriceLabel: "Average realised price on platform",
      soldThisMonth: "Sold This Month",
      totalRevenue: "Gross Revenue"
    },
    buyer: {
      title: "Procurement Requirements",
      subtitle: "Specify required produce, volume and quality. Our engine coordinates multi-farmer aggregated fulfillment.",
      productLabel: "Commodity / Crop",
      quantityLabel: "Required Quantity (kg)",
      gradeLabel: "Preferred Quality Grade",
      locationLabel: "Delivery Location",
      deliveryDateLabel: "Target Delivery Date",
      findSupplyBtn: "Find Supply & Generate Plan",
      analyzing: "Analysing available supply across verified farmers & FPOs...",
      planReady: "Smart Supply Plan Ready",
      whyThisMatch: "Why this match?",
      confirmPlanBtn: "Confirm Procurement Plan",
      trackOrder: "Track Live Delivery",
      priceBreakdown: "Transparent Price Breakdown"
    },
    driver: {
      title: "Driver Logistics Console",
      startRoute: "START ROUTE",
      inProgress: "ROUTE IN PROGRESS",
      capacityTitle: "Vehicle Capacity Status",
      nextPickup: "Next Pickup",
      stops: "Scheduled Route Stops",
      reportDelay: "Report 18-Min Delay",
      recalculating: "Recalculating alternative route ETA..."
    },
    admin: {
      title: "State Agricultural Intelligence Dashboard",
      subtitle: "Real-time supply-demand gap analysis and regional logistics monitoring",
      shortageAlert: "Supply Shortage Detected",
      actionRec: "Action Recommendation"
    }
  },
  hi: {
    brand: "किसानकार्ट (KisanKart)",
    tagline: "ताज़ा फसल, सीधे खेत से खरीदार तक",
    exploreMarketplace: "मंडी देखें",
    postRequirement: "मांग दर्ज करें",
    demoMode: "मार्केटप्लेस लाइव",
    dataSaver: "डेटा सेवर मोड",
    roles: {
      farmer: "किसान (Farmer)",
      fpo: "एफपीओ (FPO)",
      buyer: "खरीदार (Buyer)",
      driver: "चालक / रसद (Driver)",
      admin: "प्रशासन / सरकार (Admin)"
    },
    nav: {
      home: "मुख्य पृष्ठ",
      marketplace: "मंडी",
      farmerPortal: "किसान पोर्टल",
      buyerPortal: "खरीदार पोर्टल",
      fpoPortal: "एफपीओ केंद्र",
      driverPortal: "ड्राइवर रूट",
      adminPortal: "सरकारी डैशबोर्ड",
      traceability: "लॉट ट्रैकिंग"
    },
    farmer: {
      sell: "फसल बेचें",
      orders: "सक्रिय ऑर्डर",
      earnings: "कमाई और भाव",
      demand: "मांग पूर्वानुमान",
      voiceBtn: "आवाज से दर्ज करें (माइक)",
      listening: "सुन रहे हैं... बोलिए (हिंदी, मराठी या अंग्रेजी में)",
      submitListing: "फसल सूची प्रकाशित करें",
      offlineNotice: "ऑफलाइन मोड — सूची फोन में सुरक्षित है। नेटवर्क आते ही सिंक होगी।",
      onlineSync: "ऑनलाइन — सभी सूचियां सफलतापूर्वक अपलोड हो गईं ✓",
      realisedPriceLabel: "मंच पर प्राप्त औसत मूल्य",
      soldThisMonth: "इस माह कुल बिक्री",
      totalRevenue: "कुल कमाई"
    },
    buyer: {
      title: "खरीद आवश्यकता दर्ज करें",
      subtitle: "फसल, मात्रा और गुणवत्ता चुनें। इंजन कई किसानों से पूर्ति योजना तैयार करेगा।",
      productLabel: "फसल का नाम",
      quantityLabel: "आवश्यक मात्रा (किलो)",
      gradeLabel: "गुणवत्ता ग्रेड",
      locationLabel: "डिलीवरी स्थान",
      deliveryDateLabel: "वांछित डिलीवरी तिथि",
      findSupplyBtn: "आपूर्ति खोजें और योजना बनाएं",
      analyzing: "सत्यापित किसानों और एफपीओ में आपूर्ति का विश्लेषण हो रहा है...",
      planReady: "स्मार्ट आपूर्ति योजना तैयार है",
      whyThisMatch: "यह चयन क्यों?",
      confirmPlanBtn: "योजना स्वीकार करें और ऑर्डर दें",
      trackOrder: "लाइव डिलीवरी ट्रैक करें",
      priceBreakdown: "पारदर्शी मूल्य विभाजन"
    },
    driver: {
      title: "ड्राइवर परिवहन कंसोल",
      startRoute: "रूट शुरू करें",
      inProgress: "रूट चालू है",
      capacityTitle: "वाहन क्षमता स्थिति",
      nextPickup: "अगला पिकअप",
      stops: "रूट स्टॉप्स सूची",
      reportDelay: "१८ मिनट देरी की सूचना दें",
      recalculating: "वैकल्पिक मार्ग और नए समय की गणना जारी..."
    },
    admin: {
      title: "राज्य कृषि आसूचना डैशबोर्ड",
      subtitle: "क्षेत्रीय मांग-आपूर्ति असंतुलन और परिवहन निगरानी",
      shortageAlert: "आपूर्ति की कमी का अलर्ट",
      actionRec: "कार्यवाई की सिफारिश"
    }
  },
  mr: {
    brand: "किसानकार्ट (KisanKart)",
    tagline: "ताज्या शेतमालापासून थेट खरेदीदारापर्यंत",
    exploreMarketplace: "बाजारपेठ पहा",
    postRequirement: "मागणी नोंदवा",
    demoMode: "मार्केटप्लेस लाइव",
    dataSaver: "डेटा सेव्हर मोड",
    roles: {
      farmer: "शेतकरी (Farmer)",
      fpo: "एफपीओ (FPO)",
      buyer: "खरेदीदार (Buyer)",
      driver: "चालक / वाहतूक (Driver)",
      admin: "प्रशासन / शासन (Admin)"
    },
    nav: {
      home: "मुख्य पान",
      marketplace: "शेतमाल बाजार",
      farmerPortal: "शेतकरी कक्ष",
      buyerPortal: "खरेदीदार कक्ष",
      fpoPortal: "एफपीओ कक्ष",
      driverPortal: "वाहतूक रूट",
      adminPortal: "कृषी माहिती कक्ष",
      traceability: "लॉट ट्रेसिंग"
    },
    farmer: {
      sell: "शेतमाल विका",
      orders: "सध्याच्या ऑर्डर्स",
      earnings: "उत्पन्न आणि भाव",
      demand: "मागणी अंदाज",
      voiceBtn: "आवाजाने नोंदवा (माईक)",
      listening: "ऐकत आहोत... बोला (मराठी किंवा हिंदीत)",
      submitListing: "शेतमाल यादी प्रसिद्ध करा",
      offlineNotice: "ऑफलाइन मोड — माहिती सेव्ह झाली. इंटरनेट सुरू झाल्यावर आपोआप सिंक होईल.",
      onlineSync: "ऑनलाइन — शेतमाल माहिती यशस्वीरित्या सिंक झाली ✓",
      realisedPriceLabel: "प्लॅटफॉर्मवर मिळालेला सरासरी दर",
      soldThisMonth: "या महिन्यातील विक्री",
      totalRevenue: "एकूण उत्पन्न"
    },
    buyer: {
      title: "खरेदी मागणी नोंदवा",
      subtitle: "पिकाचे नाव, वजन आणि गुणवत्ता निवडा. एकापेक्षा जास्त शेतकऱ्यांकडून माल संकलित केला जाईल.",
      productLabel: "पिकाचे नाव",
      quantityLabel: "आवश्यक प्रमाण (किलो)",
      gradeLabel: "गुणवत्ता प्रत (Grade)",
      locationLabel: "डिलिव्हरीचे ठिकाण",
      deliveryDateLabel: "अपेक्षित तारीख",
      findSupplyBtn: "पुरवठा शोधा आणि प्लॅन बनवा",
      analyzing: "शेतकरी आणि एफपीओ कडील उपलब्ध साठ्याचे विश्लेषण सुरू आहे...",
      planReady: "स्मार्ट पुरवठा योजना तयार आहे",
      whyThisMatch: "हीच निवड का?",
      confirmPlanBtn: "योजना मंजूर करा आणि ऑर्डर द्या",
      trackOrder: "लाइव डिलिव्हरी ट्रॅक करा",
      priceBreakdown: "पारदर्शक दर विभागणी"
    },
    driver: {
      title: "वाहतूक चालक कक्ष",
      startRoute: "रूट सुरू करा",
      inProgress: "वाहतूक सुरू आहे",
      capacityTitle: "वाहनाची क्षमता",
      nextPickup: "पुढील संकलन",
      stops: "रूटमधील थांबे",
      reportDelay: "१८ मिनिटे विलंबाची नोंद करा",
      recalculating: "पर्यायी मार्गाचा नवा वेळ ठरवत आहोत..."
    },
    admin: {
      title: "राज्य कृषी आसूचना डॅशबोर्ड",
      subtitle: "मागणी-पुरवठा तूट आणि प्रादेशिक वाहतूक नियंत्रण",
      shortageAlert: "पुरवठ्यात तूट आढळली",
      actionRec: "शिफारस"
    }
  }
};

