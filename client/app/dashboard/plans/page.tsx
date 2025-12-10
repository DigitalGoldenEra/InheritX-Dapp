"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiPause,
  FiPlay,
  FiTrash2,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { api, Plan, KYCStatus } from "@/lib/api";
import {
  formatDate,
  getPlanStatusBadge,
  getTokenByAssetType,
} from "@/lib/contract";
import CreatePlanModal from "@/components/plans/CreatePlanModal";
import CompletePendingPlanModal from "@/components/plans/CompletePendingPlanModal";
import Link from "next/link";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingPlanToComplete, setPendingPlanToComplete] =
    useState<Plan | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, kycRes] = await Promise.all([
        api.getPlans(),
        api.getKYCStatus(),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (kycRes.data) setKycStatus(kycRes.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesFilter = filter === "ALL" || plan.status === filter;
    const matchesSearch =
      plan.planName.toLowerCase().includes(search.toLowerCase()) ||
      plan.planDescription.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (
    planId: string,
    newStatus: "ACTIVE" | "PAUSED" | "CANCELLED"
  ) => {
    try {
      const { data, error } = await api.updatePlanStatus(planId, newStatus);
      if (data) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (error) {
      console.error("Error updating plan status:", error);
    }
    setOpenMenu(null);
  };

  const copyClaimCode = async (planId: string) => {
    try {
      const { data, error } = await api.getClaimCode(planId);
      if (data?.claimCode) {
        await navigator.clipboard.writeText(data.claimCode);
        alert("Claim code copied to clipboard!");
      }
    } catch (error) {
      console.error("Error getting claim code:", error);
    }
    setOpenMenu(null);
  };

  const canCreatePlan = kycStatus?.status === "APPROVED";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-6 w-3/4 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Plans</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your inheritance plans
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreatePlan}
          className="btn btn-primary"
          title={!canCreatePlan ? "Complete KYC to create plans" : ""}
        >
          <FiPlus size={18} />
          Create Plan
        </button>
      </div>

      {/* KYC Warning */}
      {!canCreatePlan && (
        <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex-1">
            <div className="font-medium text-amber-400">KYC Required</div>
            <div className="text-sm text-amber-300/80">
              {kycStatus?.status === "PENDING"
                ? "Your KYC is pending review. You can create plans once approved."
                : "Complete KYC verification to create inheritance plans."}
            </div>
          </div>
          {kycStatus?.status !== "PENDING" && (
            <Link href="/dashboard/kyc" className="btn btn-sm btn-secondary">
              Complete KYC
            </Link>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10! w-full"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "ACTIVE", "EXECUTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn btn-sm ${filter === status ? "btn-primary" : "btn-secondary"
                }`}
            >
              {status === "ALL"
                ? "All"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <FiPlus className="text-[var(--text-muted)]" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Plans Found</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {plans.length === 0
              ? "Create your first inheritance plan to get started."
              : "No plans match your current filters."}
          </p>
          {plans.length === 0 && canCreatePlan && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <FiPlus size={16} />
              Create Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan, index) => {
            const statusBadge = getPlanStatusBadge(plan.status);
            const token = getTokenByAssetType(plan.assetType);

            return (
              <motion.div
                key={plan.id}
                className="card card-hover p-6 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === plan.id ? null : plan.id)
                    }
                    className="btn btn-icon bg-primary/5"
                  >
                    <FiMoreVertical size={18} />
                  </button>

                  <AnimatePresence>
                    {openMenu === plan.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-10 w-48 card p-2 z-10"
                      >
                        <Link
                          href={`/dashboard/plans/${plan.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <FiEye size={16} />
                          View Details
                        </Link>
                        <button
                          onClick={() => copyClaimCode(plan.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--bg-elevated)] transition-colors w-full"
                        >
                          <FiCopy size={16} />
                          Copy Claim Code
                        </button>

                        {plan.txHash && (
                          <a
                            href={`https://sepolia-blockscout.lisk.com/tx/${plan.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <FiExternalLink size={16} />
                            View on Explorer
                          </a>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="pr-8">
                  <span className={`badge ${statusBadge.variant} mb-3`}>
                    {statusBadge.label}
                  </span>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {plan.planName}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">
                    {plan.planDescription}
                  </p>
                </div>

                {/* Proceed to Create Button for PENDING plans */}
                {plan.status === "PENDING" && (
                  <div className="mb-4">
                    <button
                      onClick={() => setPendingPlanToComplete(plan)}
                      className="btn btn-primary w-full"
                    >
                      Proceed to Create
                    </button>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Amount</span>
                    <span className="font-medium">
                      {plan.assetAmount} {token?.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">
                      Beneficiaries
                    </span>
                    <span className="font-medium">
                      {plan.beneficiaries.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">
                      Distribution
                    </span>
                    <span className="font-medium">
                      {plan.distributionMethod.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">
                      Transfer Date
                    </span>
                    <span className="font-medium">
                      {formatDate(plan.transferDate)}
                    </span>
                  </div>
                </div>

                {/* Beneficiaries Preview */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      Beneficiaries
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {plan.beneficiaries.length} {plan.beneficiaries.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {plan.beneficiaries.slice(0, 4).map((ben, i) => (
                        <div
                          key={ben.id}
                          className="w-9 h-9 rounded-full bg-primary border-2 border-[var(--bg-card)] flex items-center justify-center text-xs font-semibold text-black shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title={`${ben.name} (${ben.relationship})`}
                        >
                          {ben.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {plan.beneficiaries.length > 4 && (
                        <div
                          className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--bg-card)] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)] shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title={`${plan.beneficiaries.length - 4} more beneficiary${plan.beneficiaries.length - 4 > 1 ? 'ies' : ''}`}
                        >
                          +{plan.beneficiaries.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Complete Pending Plan Modal */}
      <AnimatePresence>
        {pendingPlanToComplete && (
          <CompletePendingPlanModal
            plan={pendingPlanToComplete}
            onClose={() => setPendingPlanToComplete(null)}
            onSuccess={() => {
              setPendingPlanToComplete(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {openMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
