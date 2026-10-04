import React from 'react';
const LuxuryRestaurantManager = React.lazy(() => import('./managers/LuxuryRestaurantManager'));
const ModernGrillManager = React.lazy(() => import('./managers/ModernGrillManager'));
const FastFoodDeliveryManager = React.lazy(() => import('./managers/FastFoodDeliveryManager'));
const CozyCafeManager = React.lazy(() => import('./managers/CozyCafeManager'));
const SpecialtyCoffeeManager = React.lazy(() => import('./managers/SpecialtyCoffeeManager'));
const BakeryCafeManager = React.lazy(() => import('./managers/BakeryCafeManager'));
const LuxuryVillasManager = React.lazy(() => import('./managers/LuxuryVillasManager'));
const ModernApartmentsManager = React.lazy(() => import('./managers/ModernApartmentsManager'));
const CommercialAgencyManager = React.lazy(() => import('./managers/CommercialAgencyManager'));
const HeavyConstructionManager = React.lazy(() => import('./managers/HeavyConstructionManager'));
const ArchitectureDesignManager = React.lazy(() => import('./managers/ArchitectureDesignManager'));
const DecorFinishingManager = React.lazy(() => import('./managers/DecorFinishingManager'));
const FashionBoutiqueManager = React.lazy(() => import('./managers/FashionBoutiqueManager'));
const ElectronicStoreManager = React.lazy(() => import('./managers/ElectronicStoreManager'));
const SkincareManager = React.lazy(() => import('./managers/SkincareManager'));
const DentalClinicManager = React.lazy(() => import('./managers/DentalClinicManager'));
const CafeAndGrillManager = React.lazy(() => import('./managers/CafeAndGrillManager'));
const RealEstateManager = React.lazy(() => import('./managers/RealEstateManager'));
const ConstructionManager = React.lazy(() => import('./managers/ConstructionManager'));
const EcommerceManager = React.lazy(() => import('./managers/EcommerceManager'));

export interface DashboardTemplateProps {
  content: any;
  analyticsData: any;
  orders: any[];
  tenant: any;
  handleAddItem?: () => void;
  handleEditItem?: (item: any, index: number) => void;
  handleDeleteItem?: (id: number) => void;
  handleUpdateItem?: (id: number, field: string, value: any) => void;
  handleUpdateContent: (silent?: boolean) => void;
  setContent?: (content: any) => void;
  dashboardColor: string;
  setActiveTab: (tab: string) => void;
  templateId?: number;
}

interface DashboardTemplateRegistryProps extends DashboardTemplateProps {
  templateId: number;
}

export default function DashboardTemplateRegistry({ templateId, content, setContent, handleUpdateContent, tenant, dashboardColor, ...props }: DashboardTemplateRegistryProps) {
  const tId = Number(templateId) || 1;

  const dummySetContent = (newContent: any) => {
    if (setContent) {
      setContent(newContent);
    } else if (content) {
      Object.assign(content, newContent);
      if (handleUpdateContent) handleUpdateContent();
    }
  };

  if (tId === 1) {
    return <LuxuryRestaurantManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 2) {
    return <ModernGrillManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 3) {
    return <FastFoodDeliveryManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 4) {
    return <CozyCafeManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 5) {
    return <SpecialtyCoffeeManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 6) {
    return <BakeryCafeManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 7) {
    return <LuxuryVillasManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} dashboardColor={dashboardColor} />;
  }
  if (tId === 8) {
    return <ModernApartmentsManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} />;
  }
  if (tId === 9) {
    return <CommercialAgencyManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} />;
  }
  if (tId === 10) {
    return <HeavyConstructionManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} />;
  }
  if (tId === 11) {
    return <ArchitectureDesignManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} />;
  }
  if (tId === 12) {
    return <DecorFinishingManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} {...props} />;
  }
  if (tId === 13) {
    return <FashionBoutiqueManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} templateId={tId} {...props} />;
  }
  if (tId === 14) {
    return <EcommerceManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} templateId={tId} {...props} />;
  }
  if (tId === 15) {
    return <SkincareManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} templateId={tId} {...props} />;
  }
  if (tId === 16) {
    return <DentalClinicManager content={content} tenant={tenant} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} templateId={tId} {...props} />;
  }

  // Ecommerce and general templates
  return <EcommerceManager content={content} tenant={tenant} templateId={tId} handleUpdateContent={handleUpdateContent} setContent={dummySetContent} {...props} />;
}
