'use client';

import React, { useState } from 'react';
import { FiChevronDown, FiShield, FiFileText, FiUsers } from 'react-icons/fi';
import Navbar from '@/components/layouts/Navbar';
import { FaArrowUp } from 'react-icons/fa6';
import Image from 'next/image';

const GuidelinesPage = () => {
    const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
        privacy: false,
        code: false,
        terms: true, // Terms & Conditions expanded by default
    });

    const toggleSection = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-dark text-white px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-[120px] pb-[100px]">
            <Navbar />
            <div className="max-w-6xl mt-20 mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] md:text-[32px] text-white font-semibold mb-2 font-['Syne',sans-serif]">
                        Guidelines
                    </h1>
                    <p className="text-[#94A3B8] text-base md:text-[14px]">
                        Here are our policies and guidelines for using InheritX
                    </p>
                </div>

                {/* Guidelines Cards */}
                <div className="space-y-6 sm:space-y-8">
                    {/* Privacy Policy Card */}
                    <div className="bg-transparent border-none rounded-lg flex flex-col">
                        <button
                            className="flex items-center justify-between space-x-4 w-full focus:outline-none group"
                            onClick={() => toggleSection('privacy')}
                            aria-expanded={expanded.privacy}
                            aria-controls="privacy-content"
                        >
                            {/* Only show left bar if expanded */}
                            <div
                                className={`${expanded.privacy ? 'bg-[#33C5E0] h-[8px] w-[32px]' : 'bg-transparent w-[32px] h-[8px]'} rounded-[4px] transition-all duration-200`}
                            />

                            <div className="flex items-center justify-between w-full border-b border-white/10 py-4 group-hover:border-white/20 transition-colors">
                                <h2 className="text-[18px] md:text-[24px] font-medium text-white font-['Syne',sans-serif]">
                                    Privacy Policy
                                </h2>
                                <FiChevronDown
                                    className={`text-[#33C5E0] transition-transform duration-200 ${expanded.privacy ? '-rotate-180' : 'rotate-0'
                                        }`}
                                    size={24}
                                />
                            </div>
                        </button>
                        <div
                            id="privacy-content"
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded.privacy ? 'max-h-[2000px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
                                }`}
                        >
                            {/* Data Collection and Usage Card */}
                            <div className="bg-[#0C0F12] border border-white/6 rounded-2xl overflow-hidden p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[14px] md:text-[18px] text-white font-medium">
                                        Data Collection and Usage
                                    </h2>
                                </div>

                                {/* Content Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                    {/* Personal Information */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-4 tracking-wider uppercase">
                                            PERSONAL INFORMATION
                                        </h3>
                                        <div className="space-y-3">
                                            <h4 className="text-white text-sm sm:text-base font-medium">We Collect:</h4>
                                            <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                <li>• Legal Name And Contact Information</li>
                                                <li>• Government-Issued Identification</li>
                                                <li>• Cryptocurrency Wallet Addresses</li>
                                                <li>• Beneficiary Information</li>
                                                <li>• Communication Preferences</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Technical Data */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-4 tracking-wider uppercase">
                                            TECHNICAL DATA
                                        </h3>
                                        <div className="space-y-3">
                                            <h4 className="text-white text-sm sm:text-base font-medium">We Record:</h4>
                                            <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                <li>• Device Information</li>
                                                <li>• IP Address</li>
                                                <li>• Browser Type And Version</li>
                                                <li>• Session Information</li>
                                                <li>• System Logs</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Usage Data */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-4 tracking-wider uppercase">
                                            USAGE DATA
                                        </h3>
                                        <div className="space-y-3">
                                            <h4 className="text-white text-sm sm:text-base font-medium">We Monitor:</h4>
                                            <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                <li>• Platform Interaction Patterns</li>
                                                <li>• Security Event Logs</li>
                                                <li>• Transaction History</li>
                                                <li>• Smart Contract Interactions</li>
                                                <li>• Feature Utilization Metrics</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>


                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Data Protection Card */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-[14px] md:text-[18px] text-white font-medium">
                                            Data Protection
                                        </h2>
                                        <FiShield className="text-[#94A3B8]" size={20} />
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                        {/* Security Measures */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                SECURITY MEASURES
                                            </h3>
                                            <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                <li>• End-To-End Encryption For All Sensitive Data</li>
                                                <li>• Regular Security Audits And Penetration Testing</li>
                                                <li>• Zero-Knowledge Proof Implementation</li>
                                                <li>• Secure Key Management Systems</li>
                                                <li>• Regular Backup And Recovery Testing</li>
                                            </ul>
                                        </div>

                                        {/* Storage and Retention */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                STORAGE AND RETENTION
                                            </h3>
                                            <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                <li>• Encrypted Storage On Distributed Systems</li>
                                                <li>• Regular Data Minimization Reviews</li>
                                                <li>• Compliance With Retention Regulations</li>
                                                <li>• Secure Data Destruction Protocols</li>
                                                <li>• Backup Maintenance Procedures</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* User Rights and Controls Card */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-[14px] md:text-[18px] text-white font-medium">
                                            User Rights and Controls
                                        </h2>
                                        <FiUsers className="text-[#94A3B8]" size={20} />
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                        {/* Access Rights */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                ACCESS RIGHTS
                                            </h3>
                                            <div className="space-y-3">
                                                <h4 className="text-white text-sm sm:text-base font-medium">Users May:</h4>
                                                <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                    <li>• Request Data Copies</li>
                                                    <li>• Correct Personal Information</li>
                                                    <li>• Delete Account Data</li>
                                                    <li>• Export Transaction History</li>
                                                    <li>• Review Security Logs</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Privacy Controls */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                PRIVACY CONTROLS
                                            </h3>
                                            <div className="space-y-3">
                                                <h4 className="text-white text-sm sm:text-base font-medium">
                                                    Users Manage:
                                                </h4>
                                                <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                    <li>• Marketing Settings</li>
                                                    <li>• Communication Preferences</li>
                                                    <li>• Data Sharing Options</li>
                                                    <li>• Authentication Methods</li>
                                                    <li>• Activity Notifications</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Third-Party Sharing Card */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-[14px] md:text-[18px] text-white font-medium">
                                            Third-Party Sharing
                                        </h2>
                                        <FiUsers className="text-[#94A3B8]" size={20} />
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                        {/* Service Providers */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                SERVICE PROVIDERS
                                            </h3>
                                            <div className="space-y-3">
                                                <h4 className="text-white text-sm sm:text-base font-medium">
                                                    Limited Sharing With:
                                                </h4>
                                                <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                    <li>• Identity Verification Services</li>
                                                    <li>• Blockchain Infrastructure Partners</li>
                                                    <li>• Legal Compliance Partners</li>
                                                    <li>• Third-Party Infrastructure Providers</li>
                                                    <li>• Customer Support Systems</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Legal Requirements */}
                                        <div>
                                            <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-4 tracking-wider uppercase">
                                                LEGAL REQUIREMENTS
                                            </h3>
                                            <div className="space-y-3">
                                                <h4 className="text-white text-sm sm:text-base font-medium">
                                                    Data Shared For:
                                                </h4>
                                                <ul className="space-y-2 text-[#94A3B8] text-sm">
                                                    <li>• Regulatory Compliance</li>
                                                    <li>• Anti-Money Laundering</li>
                                                    <li>• Law Enforcement Requests</li>
                                                    <li>• Court Orders</li>
                                                    <li>• Fraud Prevention</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code of Ethics Card */}
                    <div className="bg-transparent border-none rounded-lg flex flex-col">
                        <button
                            className="flex items-center justify-between space-x-4 w-full focus:outline-none group"
                            onClick={() => toggleSection('code')}
                            aria-expanded={expanded.code}
                            aria-controls="code-content"
                        >
                            <div
                                className={`${expanded.code ? 'bg-[#33C5E0] h-[8px] w-[32px]' : 'bg-transparent w-[32px] h-[8px]'} rounded-[4px] transition-all duration-200`}
                            />
                            <div className="flex items-center justify-between w-full border-b border-white/10 py-4 group-hover:border-white/20 transition-colors">
                                <h2 className="text-[18px] md:text-[24px] font-medium text-white font-['Syne',sans-serif]">
                                    Code of Ethics
                                </h2>
                                <FiChevronDown
                                    className={`text-[#33C5E0] transition-transform duration-200 ${expanded.code ? '-rotate-180' : 'rotate-0'
                                        }`}
                                    size={24}
                                />
                            </div>
                        </button>
                        <div
                            id="code-content"
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded.code ? 'max-h-[2000px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
                                }`}
                        >
                            <div className="bg-[#0C0F12] border border-white/6 rounded-2xl overflow-hidden p-6 sm:p-8">
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-8">
                                    Core Principles
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* TRANSPARENCY */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-2 tracking-wider uppercase">
                                            TRANSPARENCY
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Are Committed To Open And Honest Communication By:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Clearly Communicating All Processes.</li>
                                            <li>Providing Regular Updates On Platform Status.</li>
                                            <li>Maintaining Open Documentation Of Procedures.</li>
                                            <li>Ensuring Honest Reporting Of Incidents.</li>
                                            <li>Offering Accessible Support Channels.</li>
                                        </ul>
                                    </div>
                                    {/* SECURITY */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-2 tracking-wider uppercase">
                                            SECURITY
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Prioritize The Safety Of User Assets Through:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Regular Security Assessments And Audits.</li>
                                            <li>Proactive Threat Monitoring.</li>
                                            <li>Immediate Response To Security Incidents.</li>
                                            <li>Continuous System Updates And Enhancements.</li>
                                            <li>Educating Users On Best Security Practices.</li>
                                        </ul>
                                    </div>
                                    {/* PRIVACY */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-2 tracking-wider uppercase">
                                            PRIVACY
                                        </h3>
                                        <p className="mb-2 text-white text-sm">We Protect User Data By:</p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Enforcing Strict Data Protection Policies.</li>
                                            <li>Minimizing Data Collection To Essential Information.</li>
                                            <li>Ensuring Secure Data Transmission.</li>
                                            <li>Conducting Regular Privacy Audits.</li>
                                            <li>Giving Users Control Over Their Personal Data.</li>
                                        </ul>
                                    </div>
                                    {/* INNOVATION */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-2 tracking-wider uppercase">
                                            INNOVATION
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Continuously Improve Our Platform By:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Advancing Blockchain And Security Technology.</li>
                                            <li>Enhancing The User Experience.</li>
                                            <li>Developing New Features For Better Usability.</li>
                                            <li>Strengthening Security Measures.</li>
                                            <li>Leading The Industry In Responsible Innovation.</li>
                                        </ul>
                                    </div>
                                    {/* COMMUNITY ENGAGEMENT */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-[#94A3B8] text-[12px] md:text-[14px] font-medium mb-2 tracking-wider uppercase">
                                            COMMUNITY ENGAGEMENT
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Foster An Ethical And Responsible User Community By:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Encouraging Active Participation And Feedback.</li>
                                            <li>Upholding Fair Treatment For All Users.</li>
                                            <li>Maintaining Open Lines Of Communication.</li>
                                            <li>Supporting Users Through Education And Assistance.</li>
                                            <li>Promoting Ethical Digital Asset Management.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* User & Platform Responsibilities */}
                                <div className="bg-white/5 h-[1px] w-full my-8"></div>
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-8 mt-12">
                                    User & Platform Responsibilities
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* USER RESPONSIBILITIES */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            USER RESPONSIBILITIES
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            To Maintain Platform Integrity, Users Must:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Provide Accurate And Truthful Information.</li>
                                            <li>Follow Security Best Practices.</li>
                                            <li>Report Suspicious Activities Or Vulnerabilities.</li>
                                            <li>Respect Platform Rules And Policies.</li>
                                            <li>Engage With The Platform And Community Ethically.</li>
                                        </ul>
                                    </div>
                                    {/* PLATFORM RESPONSIBILITIES */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            PLATFORM RESPONSIBILITIES
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            As A Responsible Service Provider, We Commit To:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Keeping Users Informed Through Regular Updates.</li>
                                            <li>Incorporating User Feedback To Improve Services.</li>
                                            <li>Ensuring Transparency In All Decision-Making.</li>
                                            <li>Offering Fair And Unbiased Dispute Resolution.</li>
                                            <li>Providing Reliable Community Support.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Compliance Framework */}
                                <div className="bg-white/5 h-[1px] w-full my-8"></div>
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-8 mt-12">
                                    Compliance Framework
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* LEGAL ADHERENCE */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            LEGAL ADHERENCE
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Ensure Full Compliance With Regulatory Standards By:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Following All Applicable Laws And Regulations.</li>
                                            <li>Maintaining Necessary Legal Documentation.</li>
                                            <li>Keeping Licenses And Certifications Up To Date.</li>
                                            <li>Conducting Regular Audits And Compliance Checks.</li>
                                            <li>Updating Policies In Response To Legal Changes.</li>
                                        </ul>
                                    </div>
                                    {/* ETHICAL STANDARDS */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            ETHICAL STANDARDS
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            We Uphold The Highest Professional And Ethical Standards By:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Maintaining Integrity In All Operations.</li>
                                            <li>Treating All Users Fairly And Equally.</li>
                                            <li>Ensuring Equal Access To Platform Features.</li>
                                            <li>Communicating Honestly And Transparently.</li>
                                            <li>Innovating Responsibly With User Security In Mind.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions Card */}
                    <div className="bg-transparent border-none rounded-lg flex flex-col">
                        <button
                            className="flex items-center justify-between space-x-4 w-full focus:outline-none group"
                            onClick={() => toggleSection('terms')}
                            aria-expanded={expanded.terms}
                            aria-controls="terms-content"
                        >
                            <div
                                className={`${expanded.terms ? 'bg-[#33C5E0] h-[8px] w-[32px]' : 'bg-transparent w-[32px] h-[8px]'} rounded-[4px] transition-all duration-200`}
                            />
                            <div className="flex items-center justify-between w-full border-b border-white/10 py-4 group-hover:border-white/20 transition-colors">
                                <h2 className="text-[18px] md:text-[24px] font-medium text-white font-['Syne',sans-serif]">
                                    Terms and Conditions
                                </h2>
                                <FiChevronDown
                                    className={`text-[#33C5E0] transition-transform duration-200 ${expanded.terms ? '-rotate-180' : 'rotate-0'
                                        }`}
                                    size={24}
                                />
                            </div>
                        </button>
                        <div
                            id="terms-content"
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded.terms ? 'max-h-[2000px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
                                }`}
                        >
                            <div className="bg-[#0C0F12] border border-white/6 rounded-2xl overflow-hidden p-6 sm:p-8">
                                {/* Account Creation */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Account Creation
                                </h2>
                                <p className="mb-2 text-white text-sm">
                                    Users Must Provide Accurate And Complete Information When Creating An Account On
                                    Our Platform. This Includes:
                                </p>
                                <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1 mb-2">
                                    <li>Legal Name, Current Address, And Valid Contact Information</li>
                                    <li>Verifiable Identification Documents When Requested</li>
                                    <li>Regular Updates To Maintain Information Accuracy</li>
                                    <li>
                                        Agreement Not To Impersonate Others Or Create Accounts For Unauthorized Purposes
                                    </li>
                                </ul>
                                <p className="mb-6 text-[#94A3B8] text-sm">
                                    The Platform Reserves The Right To Verify User Information At Any Time And May
                                    Suspend Or Terminate Accounts Containing False Or Misleading Information.
                                </p>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Usage Rules */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Usage Rules
                                </h2>
                                <p className="mb-2 text-white text-sm">
                                    Users Agree To Comply With The Following Platform Guidelines:
                                </p>
                                <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1 mb-2">
                                    <li>
                                        Adhere To All Applicable Laws And Regulations Regarding Digital Asset
                                        Transactions
                                    </li>
                                    <li>Maintain Appropriate Licenses And Permissions For Trading Activities</li>
                                    <li>Follow Platform-Specific Trading Rules And Limitations</li>
                                    <li>Respect Intellectual Property Rights And Third-Party Rights</li>
                                    <li>Refrain From Manipulative Or Deceptive Trading Practices</li>
                                    <li>
                                        Comply With Anti-Money Laundering (AML) And Know-Your-Customer (KYC)
                                        Requirements
                                    </li>
                                </ul>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Security Responsibilities */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Security Responsibilities
                                </h2>
                                <p className="mb-2 text-white text-sm">
                                    Users Acknowledge And Accept The Following Security Obligations:
                                </p>
                                <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1 mb-2">
                                    <li>Maintaining The Confidentiality Of Authentication Credentials</li>
                                    <li>Using Strong, Unique Passwords And Enabling Two-Factor Authentication</li>
                                    <li>Regular Monitoring Of Account Activity</li>
                                    <li>Immediate Reporting Of Unauthorized Access Or Suspicious Activities</li>
                                    <li>Keeping Security Software And Systems Up To Date</li>
                                </ul>
                                <p className="mb-2 text-[#94A3B8] text-sm">
                                    Following Recommended Security Practices Provided By The Platform
                                </p>
                                <p className="mb-6 text-[#94A3B8] text-sm">
                                    The Platform Reserves The Right To Implement Additional Security Measures As
                                    Needed.
                                </p>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Liability */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Liability
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* Platform Liability Limitations */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            PLATFORM LIABILITY LIMITATIONS
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            The Platform&apos;s Liability Is Limited In The Following Circumstances:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Loss Of Digital Assets Due To Market Volatility</li>
                                            <li>Technical Issues Beyond The Platform&apos;s Reasonable Control</li>
                                            <li>Third-Party Service Provider Failures</li>
                                            <li>User Error Or Negligence</li>
                                            <li>Force Majeure Events</li>
                                        </ul>
                                    </div>
                                    {/* User Liability */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            USER LIABILITY
                                        </h3>
                                        <p className="mb-2 text-white text-sm">Users Are Liable For:</p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Losses Resulting From Compromised Account Credentials</li>
                                            <li>Unauthorized Transactions From Their Account</li>
                                            <li>Violations Of Platform Rules And Guidelines</li>
                                            <li>
                                                Any Fraudulent Or Illegal Activities Conducted Through Their Account
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Dispute Resolution */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Dispute Resolution
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* Resolution Process */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            RESOLUTION PROCESS
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            Disputes Will Be Resolved Through The Following Process:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Initial Review By Platform Support Team</li>
                                            <li>Internal Investigation Of Relevant Transaction Data</li>
                                            <li>Mediation Between Involved Parties</li>
                                            <li>Final Determination By Platform Administration</li>
                                            <li>Option For Third-Party Arbitration If Necessary</li>
                                        </ul>
                                    </div>
                                    {/* Time Limits */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            TIME LIMITS
                                        </h3>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Disputes Must Be Filed Within 30 Days Of The Incident</li>
                                            <li>Platform Will Acknowledge Disputes Within 2 Business Days</li>
                                            <li>Initial Response Provided Within 5 Business Days</li>
                                            <li>Resolution Target Within 30 Days Of Filing</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Service Termination */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Service Termination
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* Platform-Initiated Termination */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            PLATFORM-INITIATED TERMINATION
                                        </h3>
                                        <p className="mb-2 text-white text-sm">
                                            The Platform May Terminate Or Suspend Services For:
                                        </p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Violation Of Terms And Conditions</li>
                                            <li>Suspicious Or Fraudulent Activity</li>
                                            <li>Extended Period Of Account Inactivity</li>
                                            <li>Regulatory Or Legal Requirements</li>
                                            <li>Platform Maintenance Or Upgrades</li>
                                            <li>Business Decisions Affecting Service Availability</li>
                                        </ul>
                                    </div>
                                    {/* Effect of Termination */}
                                    <div>
                                        <h3 className="text-[#94A3B8] text-xs sm:text-sm font-medium mb-2 tracking-wider uppercase">
                                            EFFECT OF TERMINATION
                                        </h3>
                                        <p className="mb-2 text-white text-sm">Upon Termination:</p>
                                        <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1">
                                            <li>Access To Services Will Be Immediately Suspended</li>
                                            <li>Pending Transactions May Be Completed Or Cancelled</li>
                                            <li>User Data Will Be Retained As Required By Law</li>
                                            <li>Certain Obligations Survive Termination</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-white/5 h-[1px] w-full my-8"></div>

                                {/* Modification of Terms */}
                                <h2 className="text-[20px] md:text-[24px] text-white font-semibold mb-6">
                                    Modification of Terms
                                </h2>
                                <p className="mb-2 text-white text-sm">
                                    The Platform Reserves The Right To Modify These Terms And Conditions At Any Time.
                                    Users Will Be Notified Of Significant Changes Through:
                                </p>
                                <ul className="list-disc pl-6 text-[#94A3B8] text-sm space-y-1 mb-2">
                                    <li>Email Notifications</li>
                                    <li>Platform Announcements</li>
                                    <li>Website Updates</li>
                                </ul>
                                <p className="mb-2 text-[#94A3B8] text-sm">
                                    Continued Use Of The Platform After Modifications Constitutes Acceptance Of
                                    Updated Terms.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Launch App Button */}
                    <div className="pt-4 mt-[1rem]">
                        <a
                            href="/dashboard"
                            className="group bg-[#33C5E0] hover:bg-[#2ab5cf] space-x-4 text-[#050608] text-[14px] font-bold px-8 py-4 rounded-b-[24px] rounded-t-[8px] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(51,197,224,0.4)] inline-flex items-center no-underline"
                        >
                            <span>LAUNCH APP</span>
                            <FaArrowUp
                                className="transform rotate-45 group-hover:rotate-45 transition-transform"
                                size={14}
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidelinesPage;
