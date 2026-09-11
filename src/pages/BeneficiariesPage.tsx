import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import BeneficiariesListComponent from '@/components/payables/beneficiaries/BeneficiariesListComponent';
import BeneficiaryDetailsSidebarComponent from '@/components/payables/beneficiaries/BeneficiaryDetailsSidebarComponent';
import AddBeneficiarySidebarComponent from '@/components/payables/beneficiaries/AddBeneficiarySidebarComponent';
import {
    BENEFICIARIES_LIST_FALLBACK,
    type BeneficiaryItem,
} from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';
import { useGetBeneficiariesQuery } from '@/redux/features/payables/payablesApi';

export default function BeneficiariesPage() {
    // RTK Query call for get beneficiaries list
    const { data: apiResponse } = useGetBeneficiariesQuery();

    // Local beneficiaries state with fallback
    const [beneficiariesList, setBeneficiariesList] = useState<BeneficiaryItem[]>(BENEFICIARIES_LIST_FALLBACK);

    // Selected beneficiary for details drawer
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Add beneficiary drawer state
    const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

    // Sync API data into state when available
    useEffect(() => {
        if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
            setBeneficiariesList(apiResponse.data);
        }
    }, [apiResponse]);

    const handleSelectBeneficiary = (item: BeneficiaryItem) => {
        setSelectedBeneficiary(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedBeneficiary(null);
    };

    const handleOpenAddSidebar = () => {
        setIsAddSidebarOpen(true);
    };

    const handleCloseAddSidebar = () => {
        setIsAddSidebarOpen(false);
    };

    const handleAddSuccess = (newBeneficiary: BeneficiaryItem) => {
        setBeneficiariesList((prev) => [newBeneficiary, ...prev]);
    };

    return (
        <div className="beneficiariesPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
            {/* Breadcrumb & Header Section */}
            <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--mute)] tracking-wide">
                    Payables &gt; <span className="text-[var(--ink-soft)] font-medium">Beneficiaries</span>
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Company</span>{' '}
                        <span className="font-serif italic font-normal">Beneficiaries</span>
                    </h1>

                    <div className="w-[170px] h-[38px]">
                        <CustomButtonComponent
                            id="beneficiariesPage-addBeneficiary-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <Plus className="w-4 h-4" /> Add beneficiary
                                </span>
                            }
                            type="button"
                            variant="navy"
                            onClick={handleOpenAddSidebar}
                        />
                    </div>
                </div>
            </div>

            {/* Beneficiaries List Component */}
            <BeneficiariesListComponent
                beneficiaries={beneficiariesList}
                onSelectBeneficiary={handleSelectBeneficiary}
            />

            {/* Beneficiary Details Drawer Sidebar */}
            <BeneficiaryDetailsSidebarComponent
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                beneficiary={selectedBeneficiary}
            />

            {/* Add Beneficiary Drawer Sidebar */}
            <AddBeneficiarySidebarComponent
                isOpen={isAddSidebarOpen}
                onClose={handleCloseAddSidebar}
                onAddSuccess={handleAddSuccess}
            />
        </div>
    );
}
