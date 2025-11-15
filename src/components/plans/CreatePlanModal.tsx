"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { useCreateInheritancePlan } from "@/src/hooks/useInheritX";
import { AssetType, DistributionMethod } from "@/src/lib/contract";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePlanModal({ isOpen, onClose, onSuccess }: CreatePlanModalProps) {
  const { address } = useAccount();
  const { createPlan, isPending, isConfirming, isConfirmed, error } = useCreateInheritancePlan();

  const [formData, setFormData] = useState({
    planName: "",
    planDescription: "",
    assetType: AssetType.ERC20_TOKEN1,
    assetAmount: "",
    distributionMethod: DistributionMethod.LumpSum,
    lumpSumDate: "",
    quarterlyPercentage: 0,
    yearlyPercentage: 0,
    monthlyPercentage: 0,
    additionalNote: "",
    claimCode: "",
  });

  const [beneficiaries, setBeneficiaries] = useState([
    { name: "", email: "", relationship: "" },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "assetType" || name === "distributionMethod" ? Number(value) : value,
    }));
  };

  const handleBeneficiaryChange = (index: number, field: string, value: string) => {
    setBeneficiaries((prev) =>
      prev.map((ben, i) => (i === index ? { ...ben, [field]: value } : ben))
    );
  };

  const addBeneficiary = () => {
    setBeneficiaries((prev) => [...prev, { name: "", email: "", relationship: "" }]);
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    // Validate claim code (must be 6 characters)
    if (formData.claimCode.length !== 6) {
      alert("Claim code must be exactly 6 characters");
      return;
    }

    // Validate beneficiaries
    const validBeneficiaries = beneficiaries.filter(
      (b) => b.name.trim() && b.email.trim() && b.relationship.trim()
    );

    if (validBeneficiaries.length === 0) {
      alert("Please add at least one beneficiary");
      return;
    }

    // Calculate lump sum date
    let lumpSumDate = BigInt(0);
    if (formData.distributionMethod === DistributionMethod.LumpSum) {
      if (!formData.lumpSumDate) {
        alert("Please select a date for lump sum distribution");
        return;
      }
      lumpSumDate = BigInt(Math.floor(new Date(formData.lumpSumDate).getTime() / 1000));
    }

    try {
      await createPlan(
        formData.planName,
        formData.planDescription,
        validBeneficiaries,
        formData.assetType,
        formData.assetAmount,
        formData.distributionMethod,
        lumpSumDate,
        formData.quarterlyPercentage,
        formData.yearlyPercentage,
        formData.monthlyPercentage,
        formData.additionalNote,
        formData.claimCode
      );
    } catch (err) {
      console.error("Error submitting plan:", err);
    }
  };

  // Close modal on success
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
      onClose();
    }
  }, [isConfirmed, onSuccess, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800/70 bg-[#0F171B] p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-inheritx-display text-slate-100">
                  Create New Plan
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Approval Notice */}
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <p className="text-sm text-yellow-400">
                    <strong>Note:</strong> Before creating a plan, make sure you have approved the contract to spend your tokens. 
                    You&apos;ll need to approve the amount plus the plan creation fee (1 ETH).
                  </p>
                </div>

                {/* Plan Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    name="planName"
                    value={formData.planName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    placeholder="My Inheritance Plan"
                  />
                </div>

                {/* Plan Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Plan Description *
                  </label>
                  <textarea
                    name="planDescription"
                    value={formData.planDescription}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    placeholder="Describe your inheritance plan..."
                  />
                </div>

                {/* Asset Type and Amount */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Asset Type *
                    </label>
                    <select
                      name="assetType"
                      value={formData.assetType}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    >
                      <option value={AssetType.ERC20_TOKEN1}>Primary Token</option>
                      <option value={AssetType.ERC20_TOKEN2}>USDT</option>
                      <option value={AssetType.ERC20_TOKEN3}>USDC</option>
                      <option value={AssetType.NFT}>NFT</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Asset Amount *
                    </label>
                    <input
                      type="text"
                      name="assetAmount"
                      value={formData.assetAmount}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                {/* Distribution Method */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Distribution Method *
                  </label>
                  <select
                    name="distributionMethod"
                    value={formData.distributionMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                  >
                    <option value={DistributionMethod.LumpSum}>Lump Sum</option>
                    <option value={DistributionMethod.Quarterly}>Quarterly</option>
                    <option value={DistributionMethod.Yearly}>Yearly</option>
                    <option value={DistributionMethod.Monthly}>Monthly</option>
                  </select>
                </div>

                {/* Conditional fields based on distribution method */}
                {formData.distributionMethod === DistributionMethod.LumpSum && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Distribution Date *
                    </label>
                    <input
                      type="datetime-local"
                      name="lumpSumDate"
                      value={formData.lumpSumDate}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    />
                  </div>
                )}

                {formData.distributionMethod === DistributionMethod.Quarterly && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Quarterly Percentage (must divide 100) *
                    </label>
                    <input
                      type="number"
                      name="quarterlyPercentage"
                      value={formData.quarterlyPercentage}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    />
                  </div>
                )}

                {formData.distributionMethod === DistributionMethod.Yearly && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Yearly Percentage (must divide 100) *
                    </label>
                    <input
                      type="number"
                      name="yearlyPercentage"
                      value={formData.yearlyPercentage}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    />
                  </div>
                )}

                {formData.distributionMethod === DistributionMethod.Monthly && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Monthly Percentage (must divide 100) *
                    </label>
                    <input
                      type="number"
                      name="monthlyPercentage"
                      value={formData.monthlyPercentage}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    />
                  </div>
                )}

                {/* Beneficiaries */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Beneficiaries *
                    </label>
                    <button
                      type="button"
                      onClick={addBeneficiary}
                      className="flex items-center gap-2 rounded-lg bg-[#33C5E0]/20 px-3 py-1.5 text-sm font-medium text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/30"
                    >
                      <FaPlus className="text-xs" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {beneficiaries.map((beneficiary, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">
                            Beneficiary {index + 1}
                          </span>
                          {beneficiaries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBeneficiary(index)}
                              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <input
                            type="text"
                            placeholder="Name *"
                            value={beneficiary.name}
                            onChange={(e) =>
                              handleBeneficiaryChange(index, "name", e.target.value)
                            }
                            required
                            className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none"
                          />
                          <input
                            type="email"
                            placeholder="Email *"
                            value={beneficiary.email}
                            onChange={(e) =>
                              handleBeneficiaryChange(index, "email", e.target.value)
                            }
                            required
                            className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Relationship *"
                            value={beneficiary.relationship}
                            onChange={(e) =>
                              handleBeneficiaryChange(index, "relationship", e.target.value)
                            }
                            required
                            className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Claim Code */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Claim Code (6 characters) *
                  </label>
                  <input
                    type="text"
                    name="claimCode"
                    value={formData.claimCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    required
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    placeholder="123456"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This code will be required to claim the inheritance
                  </p>
                </div>

                {/* Additional Note */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Additional Note
                  </label>
                  <textarea
                    name="additionalNote"
                    value={formData.additionalNote}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
                    placeholder="Any additional notes or instructions..."
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-400">
                    {error.message || "An error occurred"}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-slate-800/70 bg-slate-900/50 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || isConfirming}
                    className="flex-1 rounded-lg bg-[#33C5E0] px-4 py-3 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || isConfirming
                      ? "Processing..."
                      : isConfirmed
                      ? "Plan Created!"
                      : "Create Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

