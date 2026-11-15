import { useEffect, useMemo, useRef, useState } from "react";
import Auth from "./Auth.jsx";
import { auth, db } from "./firebase";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  increment,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CSS_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        html { background: #F7F8FC; }
        body {
          margin: 0 !important;
          min-width: 320px;
          display: block !important;
          place-items: initial !important;
          background: #F7F8FC !important;
          font-family: 'DM Sans', sans-serif;
          color: #20243A;
        }
        #root { width: 100%; min-height: 100vh; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }

        .app-shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
        .sidebar {
          background: #fff; border-right: 1px solid #ECEEF4;
          padding: 27px 17px; display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
        }
        .brand { display: flex; align-items: center; gap: 11px; padding: 0 10px; margin-bottom: 47px; }
        .brand-mark {
          width: 39px; height: 39px; border-radius: 13px;
          background: linear-gradient(140deg, #7667E8, #9B8CF7);
          display: grid; place-items: center; color: white; font-size: 22px; font-weight: 800;
          box-shadow: 0 5px 14px #7667E844;
        }
        .brand-name { font: 800 21px 'Manrope', sans-serif; letter-spacing: -1px; }
        .brand-name span { color: #7667E8; }
        .nav-label { color: #A1A5B5; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; padding: 0 12px; margin-bottom: 12px; }
        .nav-list { display: grid; gap: 7px; }
        .nav-button {
          border: 0; background: transparent; display: flex; align-items: center;
          width: 100%; padding: 12px 14px; border-radius: 11px; gap: 13px;
          color: #777D91; font-size: 13px; font-weight: 600; text-align: left;
          transition: .2s;
        }
        .nav-button:hover { background: #F7F6FF; color: #7667E8; }
        .nav-button.active { color: #7667E8; background: #F0EEFF; font-weight: 800; }
        .nav-icon { width: 21px; text-align: center; font-size: 19px; }
        .sidebar-bottom { margin-top: auto; }
        .help-card { background: #F7F6FF; border-radius: 13px; padding: 15px; margin: 15px 2px 20px; }
        .help-card strong { font-size: 12px; }
        .help-card p { font-size: 11px; line-height: 1.6; color: #777D91; margin: 7px 0 11px; }
        .help-card button { border: 0; background: transparent; color: #7667E8; padding: 0; font-size: 11px; font-weight: 800; }
        .profile { display: flex; align-items: center; gap: 10px; padding: 13px 8px 0; border-top: 1px solid #F0F1F5; }
        .avatar { background: #E9E6FF; color: #7667E8; border-radius: 50%; width: 36px; height: 36px; display: grid; place-items: center; font-weight: 800; }
        .avatar { overflow:hidden; flex-shrink:0; }
        .avatar img { width:100%; height:100%; display:block; object-fit:cover; }
        .profile strong { display: block; font-size: 12px; }
        .profile small { color: #A0A4B3; font-size: 10px; }

        .main { padding: 29px 38px 42px; min-width: 0; max-width: 1600px; width: 100%; margin: auto; }
        .topbar { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 33px; }
        .topbar h1 { font: 800 25px 'Manrope', sans-serif; letter-spacing: -.8px; margin: 0; }
        .topbar p { color: #999DAE; font-size: 12px; margin: 5px 0 0; }
        .top-actions { display: flex; align-items: center; gap: 12px; }
        .search-box { display: flex; align-items: center; background: white; border: 1px solid #EDEEF3; border-radius: 10px; padding: 0 12px; height: 40px; width: 210px; gap: 8px; }
        .search-box span { color: #9A9EAD; }
        .search-box input { border: 0; outline: none; width: 100%; min-width: 0; color: #333; font-size: 11px; background: transparent; }
        .primary-button {
          background: #7667E8; color: white; border: 0; border-radius: 10px;
          padding: 11px 16px; font-size: 11px; font-weight: 800;
          box-shadow: 0 4px 12px #7667E82B; transition: .2s;
        }
        .primary-button:hover { background: #6656D5; transform: translateY(-1px); }
        .secondary-button { background: #F0EEFF; color: #7667E8; border: 0; padding: 9px 13px; border-radius: 9px; font-size: 11px; font-weight: 800; }
        .muted { color: #999DAE; }

        .section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; gap: 10px; }
        .section-heading h2 { font: 800 15px 'Manrope', sans-serif; margin: 0; letter-spacing: -.3px; }
        .section-heading p { font-size: 10px; color: #A2A5B2; margin: 4px 0 0; }
        .text-link { background: none; border: 0; color: #7667E8; font-size: 11px; font-weight: 800; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 15px; margin-bottom: 27px; }
        .stat-card { background: white; border: 1px solid #EFF0F5; border-radius: 15px; padding: 19px 18px; min-width: 0; }
        .stat-top { display: flex; justify-content: space-between; align-items: center; gap: 7px; }
        .stat-label { font-size: 11px; color: #969BAC; font-weight: 600; }
        .stat-icon { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; font-size: 17px; }
        .stat-value { font: 800 22px 'Manrope', sans-serif; letter-spacing: -.8px; margin: 13px 0 8px; white-space: nowrap; }
        .stat-foot { color: #A0A4B3; font-size: 10px; }
        .positive { color: #36A891; }
        .negative { color: #E47D8D; }

        .content-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(270px, .9fr); gap: 18px; margin-bottom: 22px; }
        .panel { background: white; border: 1px solid #EFF0F5; border-radius: 15px; padding: 20px; min-width: 0; }
        .bar-chart { height: 182px; display: flex; align-items: end; justify-content: space-around; gap: 14px; border-bottom: 1px solid #F0F1F5; padding: 14px 5px 0; }
        .bar-group { flex: 1; height: 100%; display: flex; align-items: center; justify-content: end; flex-direction: column; gap: 8px; }
        .bar-pair { height: 145px; display: flex; align-items: end; gap: 5px; }
        .bar { width: 13px; border-radius: 5px 5px 2px 2px; min-height: 3px; }
        .bar.income-bar { background: #B9AFE9; }
        .bar.expense-bar { background: #7667E8; }
        .bar-label { color: #A4A7B4; font-size: 9px; padding-bottom: 10px; }
        .chart-legend { display: flex; gap: 17px; padding-top: 13px; }
        .legend-item { color: #9296A6; font-size: 10px; display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 7px; height: 7px; border-radius: 50%; }

        .category-list { display: grid; gap: 18px; margin-top: 22px; }
        .category-row { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 10px; }
        .category-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: #F3F1FF; color: #7667E8; font-size: 14px; }
        .category-name { display: block; font-size: 11px; font-weight: 700; }
        .category-meta { color: #A4A7B4; font-size: 9px; margin-top: 4px; }
        .category-amount { font-size: 11px; font-weight: 800; }
        .progress-track { background: #F0F1F6; height: 5px; border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: inherit; }

        .bottom-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .9fr); gap: 18px; }
        .transaction-list { display: grid; }
        .transaction-row { display: grid; grid-template-columns: 35px minmax(0,1fr) auto auto; align-items: center; gap: 11px; border-bottom: 1px solid #F1F2F6; padding: 12px 0; }
        .transaction-row:last-child { border-bottom: 0; }
        .transaction-title { font-size: 11px; font-weight: 800; display: block; }
        .transaction-subtitle { display: block; font-size: 9px; color: #A1A4B2; margin-top: 4px; }
        .transaction-amount { font-size: 11px; font-weight: 800; white-space: nowrap; }
        .transaction-date { font-size: 9px; color: #A1A4B2; white-space: nowrap; }
        .top-expense-rank { width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; background: #F3F1FF; color: #7667E8; font-size: 10px; font-weight: 800; }

        .budget-total { font: 800 25px 'Manrope', sans-serif; margin: 22px 0 4px; }
        .budget-caption { color: #999DAE; font-size: 10px; }
        .budget-track { height: 9px; background: #F0F1F6; border-radius: 20px; overflow: hidden; margin: 18px 0 9px; }
        .budget-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, #7868E9, #A69AF7); }
        .budget-meta { display: flex; justify-content: space-between; font-size: 10px; color: #969BAC; }

        .filters { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-bottom: 17px; }
        .filter-control { padding: 10px 12px; border: 1px solid #ECEEF4; border-radius: 9px; outline: none; background: white; color: #63697D; font-size: 11px; }
        .table-wrap { overflow-x: auto; }
        .transaction-table { border-collapse: collapse; width: 100%; min-width: 650px; text-align: left; }
        .transaction-table th { color: #A0A4B2; font-size: 9px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; padding: 12px 10px; background: #FAFAFC; }
        .transaction-table td { padding: 13px 10px; border-bottom: 1px solid #F1F2F6; font-size: 11px; }
        .transaction-table td:first-child { font-weight: 700; }
        .type-pill { padding: 5px 9px; border-radius: 20px; font-size: 9px; font-weight: 800; }
        .income-pill { background: #EAF8F3; color: #299B79; }
        .expense-pill { background: #FFF0F1; color: #D96A7C; }
        .action-button { background: none; border: 0; color: #858A9B; font-size: 12px; padding: 5px; }
        .action-button:hover { color: #7667E8; }
        .empty-state { text-align: center; padding: 35px 10px; color: #A0A4B2; font-size: 11px; }

        .budget-page-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 15px; }
        .budget-category-card { padding: 17px; border: 1px solid #EFF0F5; border-radius: 13px; background: white; }
        .report-summary { display: grid; grid-template-columns: repeat(2,1fr); gap: 15px; }

        .modal-backdrop { position: fixed; z-index: 100; inset: 0; background: #20243A77; display: grid; place-items: center; padding: 15px; }
        .modal { background: white; width: min(100%, 470px); border-radius: 18px; padding: 25px; box-shadow: 0 20px 80px #0002; max-height: 90vh; overflow: auto; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .modal-header h2 { font: 800 19px 'Manrope', sans-serif; margin: 0; }
        .close-button { border: 0; background: #F3F3F8; border-radius: 8px; width: 29px; height: 29px; color: #777D91; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-field { display: grid; gap: 7px; margin-bottom: 14px; }
        .form-field.full { grid-column: 1/-1; }
        .form-field label { font-size: 10px; font-weight: 800; color: #74798A; }
        .form-field input, .form-field select { height: 42px; width: 100%; border: 1px solid #E9EAF1; background: #FAFAFC; border-radius: 9px; padding: 0 11px; outline: none; font-size: 11px; color: #35394D; }
        .form-field input:focus, .form-field select:focus { border-color: #9A8FF0; }
        .amount-control { position: relative; width: 100%; }
        .amount-control input { padding-right: 43px; }
        .amount-stepper { position: absolute; top: 5px; right: 6px; bottom: 5px; display: grid; grid-template-rows: 1fr 1fr; gap: 2px; width: 27px; }
        .amount-stepper button { border: 0; border-radius: 4px; background: #F0EEFF; color: #7667E8; font-size: 9px; line-height: 1; padding: 0; }
        .amount-stepper button:hover { background: #E6E1FF; }
        .amount-stepper button:focus-visible { outline: 2px solid #7667E8; outline-offset: 1px; }
        .amount-control input { width: 100%; min-width: 0; }
        .inline-budget-form .amount-control { flex: 1; min-width: 0; }
        .inline-budget-form .amount-control input { height: 38px; width: 100%; border: 1px solid #E9EAF1; background: #FAFAFC; border-radius: 9px; padding: 0 43px 0 10px; color: #35394D; font-size: 11px; }
        .app-shell.theme-dark .inline-budget-form .amount-control input { background:#24273B !important; color:#F1F2FA !important; border-color:#3A3E58 !important; }

        .modal-actions { display: flex; justify-content: end; gap: 9px; margin-top: 10px; }
        .cancel-button { border: 1px solid #E9EAF1; border-radius: 9px; background: white; padding: 10px 15px; color: #74798A; font-size: 11px; font-weight: 700; }

        .donut-wrap { display: flex; justify-content: center; padding: 15px 0 22px; }
        .donut { width: 155px; height: 155px; border-radius: 50%; display: grid; place-items: center; }
        .donut-hole { width: 105px; height: 105px; border-radius: 50%; background: white; display: grid; place-items: center; text-align: center; }
        .donut-hole strong { display: block; font: 800 17px 'Manrope'; }
        .donut-hole span { color: #A1A4B2; font-size: 9px; }

        @media (max-width: 1050px) {
          .main { padding: 25px 22px; }
          .stats-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 800px) {
          .app-shell { grid-template-columns: 1fr; }
          .sidebar { position: static; height: auto; padding: 14px; border-right: 0; border-bottom: 1px solid #ECEEF4; }
          .brand { margin: 0 0 13px; }
          .sidebar-bottom { display: none; }
          .nav-label { display: none; }
          .nav-list { display: flex; overflow-x: auto; }
          .nav-button { width: auto; white-space: nowrap; padding: 10px 12px; }
          .main { padding: 23px 15px; }
          .content-grid, .bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 530px) {
          .topbar { align-items: flex-start; flex-direction: column; }
          .top-actions { width: 100%; flex-wrap: wrap; }
          .search-box { flex: 1; width: auto; }
          .stats-grid { gap: 9px; }
          .stat-card { padding: 13px 11px; }
          .stat-value { font-size: 17px; }
          .stat-label { font-size: 10px; }
          .stat-foot { font-size: 9px; }
          .budget-page-grid, .report-summary { grid-template-columns: 1fr; }
          .panel { padding: 15px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-field.full { grid-column: auto; }
          .transaction-row { grid-template-columns: 32px minmax(0,1fr) auto; }
          .transaction-date { display: none; }
        }
      
/* ===================================
   FINPILOT - IMPROVED TYPOGRAPHY
=================================== */

/* Sidebar */
.brand-name {
  font-size: 23px;
}

.nav-label {
  font-size: 12px;
}

.nav-button {
  font-size: 15px;
}

.help-card strong {
  font-size: 14px;
}

.help-card p,
.help-card button {
  font-size: 13px;
}

.profile strong {
  font-size: 14px;
}

.profile small {
  font-size: 12px;
}

/* Page headings */
.topbar h1 {
  font-size: 29px;
}

.topbar p {
  font-size: 14px;
}

/* Search and buttons */
.search-box input {
  font-size: 13px;
}

.primary-button,
.secondary-button {
  font-size: 13px;
}

/* Dashboard cards */
.stat-label {
  font-size: 13px;
}

.stat-value {
  font-size: 25px;
}

.stat-foot {
  font-size: 12px;
}

/* Section headings */
.section-heading h2 {
  font-size: 17px;
}

.section-heading p {
  font-size: 12px;
}

.text-link {
  font-size: 13px;
}

/* Charts and categories */
.legend-item {
  font-size: 12px;
}

.bar-label {
  font-size: 11px;
}

.category-name {
  font-size: 13px;
}

.category-meta {
  font-size: 11px;
}

.category-amount {
  font-size: 13px;
}

/* Transactions */
.transaction-title {
  font-size: 13px;
}

.transaction-subtitle {
  font-size: 11px;
}

.transaction-amount {
  font-size: 13px;
}

.transaction-date {
  font-size: 11px;
}

/* Budgets */
.budget-caption,
.budget-meta {
  font-size: 12px;
}

/* Filters and tables */
.filter-control {
  font-size: 13px;
}

.transaction-table th {
  font-size: 11px;
}

.transaction-table td {
  font-size: 13px;
}

.type-pill {
  font-size: 11px;
}

.action-button {
  font-size: 15px;
}

/* Forms and modals */
.modal-header h2 {
  font-size: 22px;
}

.form-field label {
  font-size: 12px;
}

.form-field input,
.form-field select {
  font-size: 13px;
}

.cancel-button {
  font-size: 13px;
}

/* FINPILOT - LARGE, READABLE TRANSACTION TEXT */

.transaction-table {
  min-width: 750px !important;
}

.transaction-table th {
  font-size: 15px !important;
  padding: 17px 12px !important;
  letter-spacing: 0.5px;
}

.transaction-table td {
  font-size: 16px !important;
  padding: 19px 12px !important;
}

.transaction-table td:first-child {
  font-size: 16px !important;
  font-weight: 700;
}

.transaction-table td:nth-child(2),
.transaction-table td:nth-child(3),
.transaction-table td:nth-child(4) {
  font-size: 16px !important;
}

.type-pill {
  font-size: 14px !important;
  padding: 7px 11px !important;
}

.action-button {
  font-size: 19px !important;
  padding: 7px !important;
}

.filter-control {
  font-size: 15px !important;
  padding: 12px 14px !important;
}

.text-link,
.secondary-button {
  font-size: 15px !important;
}

.empty-state {
  font-size: 16px !important;
}

/* FINPILOT - SECONDARY TEXT READABILITY */

.topbar p,
.section-heading p,
.stat-foot,
.help-card p,
.profile small,
.category-meta,
.transaction-subtitle,
.transaction-date,
.legend-item,
.bar-label,
.budget-caption,
.budget-meta,
.muted,
.empty-state {
  font-size: 15px !important;
  color: #737B91 !important;
  font-weight: 500 !important;
}

/* Chart labels */
.chart-legend {
  gap: 22px;
}

/* Category and transaction descriptions */
.category-meta,
.transaction-subtitle {
  line-height: 1.6;
}

/* Sidebar supporting text */
.nav-label {
  font-size: 14px !important;
  color: #737B91 !important;
}

/* Report and budget supporting text */
.budget-meta {
  line-height: 1.7;
}

/* Logout pop-up: revealed when the pointer reaches the right side of the profile */
.profile {
  position: relative;
  padding-right: 48px;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-info strong,
.profile-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-logout-zone {
  position: absolute;
  top: 13px;
  right: 6px;
  bottom: 0;
  width: 46px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 5;
}

.profile-more-trigger {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #858A9B;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, opacity 0.2s;
}

.profile-more-trigger:hover {
  background: #F0EEFF;
  color: #7667E8;
}

.logout-button {
  position: absolute;
  right: 0;
  top: 50%;
  margin-left: 0;
  padding: 9px 12px;
  border: 1px solid #E8E6F3;
  border-radius: 9px;
  background: white;
  color: #7667E8;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 8px 24px #25204A1F;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-50%) translateX(5px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
  z-index: 6;
}

.profile-logout-zone:hover .logout-button,
.profile-logout-zone:focus-within .logout-button {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

.profile-logout-zone:hover .profile-more-trigger,
.profile-logout-zone:focus-within .profile-more-trigger {
  opacity: 0;
  pointer-events: none;
}

.logout-button:hover {
  background: #F0EEFF;
  border-color: #7667E8;
}

@media (hover: none) {
  .profile {
    padding-right: 0;
  }

  .profile-logout-zone {
    position: static;
    width: auto;
    margin-left: auto;
  }

  .profile-more-trigger {
    display: none;
  }

  .logout-button {
    position: static;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    box-shadow: none;
  }
}

      

/* Basic feature additions */
.form-field textarea { width:100%; min-height:92px; resize:vertical; border:1px solid #E9EAF1; background:#FAFAFC; border-radius:9px; padding:11px; outline:none; font-size:13px; color:#35394D; font-family:inherit; }
.form-field textarea:focus { border-color:#9A8FF0; }
.filters .date-filter { display:grid; gap:5px; color:#777D91; font-size:11px; font-weight:700; }
.filters .date-filter input { min-width:145px; }
.filter-actions { display:flex; gap:8px; flex-wrap:wrap; }
.category-management-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
.category-management-list {
  display:grid; gap:0; margin-top:14px; max-height:420px; overflow-y:auto;
  padding:2px 8px 2px 0; scrollbar-width:thin; scrollbar-color:#BDB5F5 #F4F3FA;
  overscroll-behavior:contain;
}
.category-management-list::-webkit-scrollbar { width:8px; }
.category-management-list::-webkit-scrollbar-track { background:#F4F3FA; border-radius:20px; }
.category-management-list::-webkit-scrollbar-thumb { background:#BDB5F5; border-radius:20px; }
.category-management-row { display:flex; align-items:center; gap:10px; padding:11px 4px; border-bottom:1px solid #F1F2F6; min-height:58px; transition:background .15s ease, opacity .15s ease, border-color .15s ease; }
.category-management-row:last-child { border-bottom:0; }
.category-management-row.is-dragging { opacity:.45; background:#F6F4FF; }
.category-management-row.is-drag-over { border-top:2px solid #7667E8; background:#FAF9FF; }
.category-drag-handle {
  display:grid; place-items:center; flex:0 0 28px; width:28px; height:34px; padding:0;
  border:1px solid #E8E5FA; border-radius:8px; background:#F8F7FF; color:#7667E8;
  font-size:20px; line-height:1; cursor:grab; touch-action:none; user-select:none;
}
.category-drag-handle:active { cursor:grabbing; background:#EFECFF; }
.category-drag-handle:disabled { opacity:.4; cursor:not-allowed; }
.category-management-row .category-details { flex:1; min-width:0; }
.category-management-row .category-details strong { display:block; font-size:13px; overflow-wrap:anywhere; }
.category-management-row .category-details small { display:block; color:#8A90A2; font-size:11px; margin-top:3px; }
.category-management-actions { display:flex; align-items:center; gap:7px; flex-shrink:0; }
.category-reorder-actions { display:flex; align-items:center; gap:3px; }
.category-move-button {
  display:grid; place-items:center; width:27px; height:27px; padding:0;
  border:1px solid #E8E5FA; border-radius:7px; background:#F8F7FF;
  color:#7667E8; font-size:14px; font-weight:800; line-height:1;
}
.category-move-button:hover:not(:disabled) { background:#EFECFF; border-color:#CFC8FA; }
.category-move-button:disabled { opacity:.3; cursor:not-allowed; }
.category-tag { display:inline-flex; align-items:center; border-radius:99px; padding:4px 8px; font-size:10px; font-weight:800; background:#F0EEFF; color:#7667E8; }
.category-order-hint { margin:0; color:#9297A8; font-size:11px; line-height:1.5; }
.profile-card, .settings-card { background:white; border:1px solid #EFF0F5; border-radius:15px; padding:22px; max-width:760px; }
.profile-avatar-large { display:grid; place-items:center; width:66px; height:66px; border-radius:20px; background:#E9E6FF; color:#7667E8; font:800 28px 'Manrope',sans-serif; margin-bottom:18px; }
.profile-header-row { display:flex; align-items:center; gap:18px; margin:4px 0 24px; flex-wrap:wrap; }
.profile-avatar-large { overflow:hidden; flex:0 0 88px; width:88px; height:88px; margin:0; border-radius:50%; }
.profile-avatar-large img { display:block; width:100%; height:100%; object-fit:cover; }
.profile-photo-copy { min-width:220px; flex:1; }
.profile-photo-copy strong { display:block; color:#20243A; font-size:13px; }
.profile-photo-copy p { color:#8A90A2; font-size:11px; line-height:1.5; margin:5px 0 10px; }
.profile-photo-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.profile-photo-button { border:1px solid #E8E5FA; border-radius:9px; background:#F8F7FF; color:#7667E8; padding:8px 11px; font-size:11px; font-weight:800; }
.profile-photo-button:hover:not(:disabled) { background:#EFECFF; }
.profile-photo-button.danger { background:#FFF3F4; border-color:#F8DDE1; color:#C85D70; }
.profile-photo-button:disabled { opacity:.55; cursor:wait; }
.profile-photo-preview { display:block; max-width:100%; max-height:65vh; margin:0 auto; object-fit:contain; border-radius:12px; }
.profile-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 14px; }
@media(max-width:560px) { .profile-form-grid { grid-template-columns:1fr; } }
.app-shell.theme-dark .profile-photo-copy strong { color:#F1F2FA; }
.app-shell.theme-dark .profile-photo-button { background:#302C50; border-color:#484365; color:#C0B8FF; }
.app-shell.theme-dark .profile-photo-button.danger { background:#482B3B; border-color:#684052; color:#FFC1CB; }

.profile-email-note { font-size:12px; line-height:1.6; color:#8A90A2; margin:0 0 18px; }
.settings-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(210px,280px); align-items:center; gap:18px; padding:17px 0; border-bottom:1px solid #F0F1F5; }
.settings-row:last-of-type { border-bottom:0; }
.settings-row strong { display:block; font-size:13px; }
.settings-row small { display:block; color:#8A90A2; font-size:11px; margin-top:4px; line-height:1.5; }
.settings-row select { width:100%; }
.note-preview { display:block; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#8A90A2; font-size:11px; margin-top:4px; }
@media(max-width:760px) { .category-management-grid { grid-template-columns:1fr; } .settings-row { grid-template-columns:1fr; gap:9px; } }

/* FinPilot dark theme */
.app-shell.theme-dark { background:#171827; color:#F1F2FA; }
.app-shell.theme-dark .sidebar, .app-shell.theme-dark .panel, .app-shell.theme-dark .stat-card, .app-shell.theme-dark .profile-card, .app-shell.theme-dark .settings-card { background:#202236; border-color:#30334B; color:#F1F2FA; }
.app-shell.theme-dark .main h1, .app-shell.theme-dark .section-heading h2, .app-shell.theme-dark .profile-card h2, .app-shell.theme-dark .settings-card h2 { color:#F1F2FA; }
.app-shell.theme-dark .nav-button { color:#B8BCD0; }
.app-shell.theme-dark .nav-button.active, .app-shell.theme-dark .nav-button:hover { background:#302C50; color:#B8AFFF; }
.app-shell.theme-dark .search-box, .app-shell.theme-dark .filter-control, .app-shell.theme-dark .form-field input, .app-shell.theme-dark .form-field select, .app-shell.theme-dark .form-field textarea { background:#292C43; color:#F1F2FA; border-color:#3A3E58; }
.app-shell.theme-dark .transaction-table th { background:#292C43; color:#B8BCD0; }
.app-shell.theme-dark .transaction-table td, .app-shell.theme-dark .transaction-row, .app-shell.theme-dark .category-management-row, .app-shell.theme-dark .settings-row { border-color:#353951; }
.app-shell.theme-dark .transaction-table td, .app-shell.theme-dark .transaction-title, .app-shell.theme-dark .category-management-row .category-details strong, .app-shell.theme-dark .settings-row strong { color:#F1F2FA; }
.app-shell.theme-dark .help-card, .app-shell.theme-dark .category-icon, .app-shell.theme-dark .top-expense-rank { background:#302C50; }
.app-shell.theme-dark .category-move-button { background:#302C50; color:#C0B8FF; border-color:#484365; }
.app-shell.theme-dark .category-management-list::-webkit-scrollbar-track { background:#292C43; }
.app-shell.theme-dark .category-management-list::-webkit-scrollbar-thumb { background:#625B91; }
.app-shell.theme-dark .donut-hole { background:#202236; }
.app-shell.theme-dark .budget-track, .app-shell.theme-dark .progress-track { background:#383B53; }
.app-shell.theme-dark .secondary-button { background:#302C50; color:#C0B8FF; }
.app-shell.theme-dark .muted, .app-shell.theme-dark .stat-label, .app-shell.theme-dark .stat-foot, .app-shell.theme-dark .category-meta, .app-shell.theme-dark .transaction-subtitle, .app-shell.theme-dark .transaction-date, .app-shell.theme-dark .settings-row small { color:#AEB3C8 !important; }


/* Accounts, transfers, CSV imports and achievements */
.account-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; }
.account-card { min-width:0; background:#fff; border:1px solid #EFF0F5; border-radius:15px; padding:19px; }
.account-card-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.account-type-icon { width:38px; height:38px; display:grid; place-items:center; border-radius:11px; background:#F0EEFF; color:#7667E8; font-size:19px; }
.account-card h3 { margin:14px 0 3px; font:800 16px Manrope,sans-serif; color:#20243A; overflow-wrap:anywhere; }
.account-currency-label,.account-balance-caption { color:#9297A8; font-size:11px; }
.account-balance { margin-top:15px; font:800 23px Manrope,sans-serif; overflow-wrap:anywhere; }
.account-card .feature-card-actions { margin-top:15px; }
.csv-upload-zone { min-height:150px; border:2px dashed #CFC8F4; border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; padding:20px; background:#FAF9FF; color:#5145B8; cursor:pointer; text-align:center; }
.csv-upload-zone input { max-width:100%; margin-top:7px; }
.csv-upload-zone small { color:#858B9D; }
.csv-template { display:block; overflow-x:auto; padding:12px; border-radius:9px; background:#F5F4FA; line-height:1.7; }
.csv-errors { margin-top:15px; padding:12px; border-radius:9px; background:#FFF5F5; color:#A23C50; font-size:12px; }
.import-success { margin-top:14px; padding:12px; border-radius:9px; background:#EAF8F3; color:#258265; font-size:13px; }
.achievement-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:18px 0; }
.achievement-summary > div { padding:17px; border-radius:12px; background:#F7F6FF; }
.achievement-summary strong { display:block; font:800 24px Manrope,sans-serif; color:#5145B8; }
.achievement-summary span { display:block; color:#777D91; font-size:11px; margin-top:4px; }
.achievement-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.achievement-card { display:flex; align-items:flex-start; gap:12px; padding:14px; border:1px solid #EFF0F5; border-radius:12px; min-width:0; }
.achievement-card.locked { opacity:.72; background:#FAFAFC; }
.achievement-icon { width:38px; height:38px; display:grid; place-items:center; flex:0 0 38px; background:#F0EEFF; border-radius:11px; font-size:20px; }
.achievement-copy { flex:1; min-width:0; }
.achievement-copy h3 { margin:1px 0 4px; font:800 13px Manrope,sans-serif; }
.achievement-copy p { margin:0; color:#858B9D; font-size:11px; line-height:1.5; }
.achievement-copy small { display:block; color:#858B9D; font-size:10px; margin-top:6px; }
.app-shell.theme-dark .account-card,.app-shell.theme-dark .achievement-card { background:#202236; border-color:#30334B; color:#F1F2FA; }
.app-shell.theme-dark .account-card h3,.app-shell.theme-dark .achievement-copy h3 { color:#F1F2FA; }
.app-shell.theme-dark .account-type-icon,.app-shell.theme-dark .achievement-icon,.app-shell.theme-dark .achievement-summary > div { background:#302C50; color:#C0B8FF; }
.app-shell.theme-dark .achievement-summary strong { color:#D0CAFF; }
.app-shell.theme-dark .achievement-summary span,.app-shell.theme-dark .account-currency-label,.app-shell.theme-dark .account-balance-caption,.app-shell.theme-dark .achievement-copy p,.app-shell.theme-dark .achievement-copy small { color:#AEB3C8; }
.app-shell.theme-dark .csv-upload-zone { background:#24273B; border-color:#625B91; color:#D0CAFF; }
.app-shell.theme-dark .csv-template { background:#292C43; color:#E5E7F0; }
.app-shell.theme-dark .csv-errors { background:#482A39; color:#FFB5C2; }
.app-shell.theme-dark .import-success { background:#173D38; color:#7CE0C2; }
@media(max-width:1100px) { .account-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:760px) { .account-grid,.achievement-grid { grid-template-columns:1fr; } .achievement-summary { grid-template-columns:1fr; } }

/* Complete dark mode: includes the document background, sidebar footer, forms and dialogs. */
html[data-finpilot-theme="dark"],
body[data-finpilot-theme="dark"],
body[data-finpilot-theme="dark"] #root {
  background:#111321 !important;
  color:#F1F2FA !important;
  color-scheme:dark;
}
.app-shell.theme-dark { min-height:100vh; width:100%; background:#111321 !important; color:#F1F2FA !important; }
.app-shell.theme-dark .sidebar { background:#191B2C !important; border-color:#30334B !important; color:#F1F2FA; }
.app-shell.theme-dark .main { background:#111321 !important; color:#F1F2FA; }
.app-shell.theme-dark .brand-name,
.app-shell.theme-dark .profile-info strong,
.app-shell.theme-dark .profile-card h2,
.app-shell.theme-dark .modal-header h2,
.app-shell.theme-dark .category-name,
.app-shell.theme-dark .budget-total,
.app-shell.theme-dark .transaction-title,
.app-shell.theme-dark .category-amount,
.app-shell.theme-dark .donut-hole strong { color:#F1F2FA !important; }
.app-shell.theme-dark .topbar p,
.app-shell.theme-dark .section-heading p,
.app-shell.theme-dark .profile-info small,
.app-shell.theme-dark .help-card p,
.app-shell.theme-dark .profile-email-note,
.app-shell.theme-dark .profile-photo-copy p,
.app-shell.theme-dark .category-order-hint,
.app-shell.theme-dark .budget-caption,
.app-shell.theme-dark .budget-meta,
.app-shell.theme-dark .legend-item,
.app-shell.theme-dark .empty-state,
.app-shell.theme-dark .note-preview { color:#AEB3C8 !important; }
.app-shell.theme-dark .help-card { background:#262744 !important; color:#F1F2FA; }
.app-shell.theme-dark .profile { border-color:#343850 !important; }
.app-shell.theme-dark .search-box,
.app-shell.theme-dark .filter-control,
.app-shell.theme-dark .form-field input,
.app-shell.theme-dark .form-field select,
.app-shell.theme-dark .form-field textarea,
.app-shell.theme-dark .modal { background:#24273B !important; color:#F1F2FA !important; border-color:#3A3E58 !important; }
.app-shell.theme-dark .search-box input { background:transparent !important; color:#F1F2FA !important; }
.app-shell.theme-dark .search-box input::placeholder,
.app-shell.theme-dark .form-field input::placeholder,
.app-shell.theme-dark .form-field textarea::placeholder { color:#8F96B0 !important; }
.app-shell.theme-dark .form-field label { color:#C6CAD9 !important; }
.app-shell.theme-dark .transaction-table th { background:#292C43 !important; color:#B8BCD0 !important; }
.app-shell.theme-dark .transaction-table td { color:#E5E7F0; border-color:#353951 !important; }
.app-shell.theme-dark .transaction-table td:first-child { color:#F1F2FA; }
.app-shell.theme-dark .transaction-row,
.app-shell.theme-dark .category-management-row,
.app-shell.theme-dark .settings-row { border-color:#353951 !important; }
.app-shell.theme-dark .budget-category-card { background:#202236 !important; border-color:#30334B !important; color:#F1F2FA; }
.app-shell.theme-dark .modal-backdrop { background:#070914CC !important; }
.app-shell.theme-dark .close-button { background:#343850 !important; color:#E2E4EF !important; }
.app-shell.theme-dark .cancel-button { background:#292C43 !important; color:#D5D8E5 !important; border-color:#42465F !important; }
.app-shell.theme-dark .type-pill.income-pill { background:#173D38 !important; color:#7CE0C2 !important; }
.app-shell.theme-dark .type-pill.expense-pill { background:#482A39 !important; color:#FFB5C2 !important; }
.app-shell.theme-dark .category-management-row.is-dragging { background:#302C50 !important; }
.app-shell.theme-dark .category-management-row.is-drag-over { background:#292642 !important; }
.app-shell.theme-dark .category-drag-handle,
.app-shell.theme-dark .category-move-button,
.app-shell.theme-dark .profile-more-trigger { background:#302C50 !important; color:#C0B8FF !important; border-color:#484365 !important; }
.app-shell.theme-dark .logout-button { background:#292C43 !important; color:#C0B8FF !important; border-color:#484365 !important; }
.app-shell.theme-dark .amount-stepper button { background:#383457 !important; color:#D0CAFF !important; }
.app-shell.theme-dark .chart-legend,
.app-shell.theme-dark .bar-chart { border-color:#353951 !important; }
.app-shell.theme-dark .donut-hole { background:#202236 !important; }
.app-shell.theme-dark .settings-rate-note { color:#AEB3C8 !important; }
.app-shell.theme-dark a { color:#BDB5FF; }
/* Dialogs are rendered outside .app-shell, so style them from the document theme. */
body[data-finpilot-theme="dark"] .modal-backdrop { background:#070914DD !important; }
body[data-finpilot-theme="dark"] .modal { background:#202236 !important; color:#F1F2FA !important; border:1px solid #383C55; }
body[data-finpilot-theme="dark"] .modal-header h2 { color:#F1F2FA !important; }
body[data-finpilot-theme="dark"] .modal .form-field label { color:#C6CAD9 !important; }
body[data-finpilot-theme="dark"] .modal .form-field input,
body[data-finpilot-theme="dark"] .modal .form-field select,
body[data-finpilot-theme="dark"] .modal .form-field textarea { background:#292C43 !important; color:#F1F2FA !important; border-color:#3A3E58 !important; }
body[data-finpilot-theme="dark"] .modal .form-field input::placeholder,
body[data-finpilot-theme="dark"] .modal .form-field textarea::placeholder { color:#8F96B0 !important; }
body[data-finpilot-theme="dark"] .modal .close-button { background:#343850 !important; color:#E2E4EF !important; }
body[data-finpilot-theme="dark"] .modal .cancel-button { background:#292C43 !important; color:#D5D8E5 !important; border-color:#42465F !important; }

/* Intermediate finance features */
.nav-list { max-height:calc(100vh - 370px); min-height:190px; overflow-y:auto; overscroll-behavior:contain; }
.feature-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.feature-card { background:#fff; border:1px solid #EFF0F5; border-radius:14px; padding:17px; min-width:0; }
.feature-card h3 { margin:0; font:800 14px Manrope,sans-serif; }
.feature-card p { color:#9297A8; font-size:11px; line-height:1.55; margin:6px 0 0; }
.feature-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.feature-card-meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; color:#858B9D; font-size:10px; }
.feature-card-actions { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-top:14px; }
.inline-budget-form { display:flex; gap:8px; margin-top:13px; align-items:center; }
.inline-budget-form input { min-width:0; flex:1; height:38px; border:1px solid #E9EAF1; background:#FAFAFC; border-radius:9px; padding:0 10px; color:#35394D; }
.insight-list { display:grid; gap:12px; }
.insight-item { display:flex; gap:12px; align-items:flex-start; padding:15px; border:1px solid #EFF0F5; border-radius:12px; background:#fff; }
.insight-icon { width:34px; height:34px; flex-shrink:0; display:grid; place-items:center; border-radius:10px; background:#F0EEFF; color:#7667E8; font-size:17px; }
.insight-item strong { display:block; font-size:12px; }
.insight-item p { margin:5px 0 0; color:#858B9D; font-size:11px; line-height:1.6; }
.comparison-table { width:100%; border-collapse:collapse; margin-top:14px; }
.comparison-table th,.comparison-table td { padding:12px 9px; border-bottom:1px solid #F0F1F5; text-align:right; font-size:11px; }
.comparison-table th:first-child,.comparison-table td:first-child { text-align:left; }
.comparison-table th { color:#9297A8; font-size:10px; }
.goal-progress { height:9px; background:#F0F1F6; border-radius:20px; overflow:hidden; margin:13px 0 8px; }
.goal-progress > span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#7667E8,#A69AF7); }
.status-pill { display:inline-flex; align-items:center; padding:5px 9px; border-radius:30px; font-size:9px; font-weight:800; background:#F0EEFF; color:#7667E8; white-space:nowrap; }
.status-pill.warning { background:#FFF3E3; color:#B97820; }
.status-pill.danger { background:#FFF0F1; color:#C84D63; }
.status-pill.success { background:#EAF8F3; color:#258265; }
.reminder-date { font-size:11px; font-weight:800; white-space:nowrap; }
.feature-page-intro { color:#8B91A3; font-size:11px; line-height:1.6; margin:-5px 0 16px; }
@media(max-width:950px) { .reminder-row { grid-template-columns:30px minmax(0,1fr) auto; } .reminder-row .feature-card-actions { grid-column:2/-1; } }
@media(max-width:760px) { .feature-grid { grid-template-columns:1fr; } .nav-list { max-height:none; min-height:0; overflow-y:visible; } }
.app-shell.theme-dark .feature-card,.app-shell.theme-dark .insight-item { background:#202236 !important; border-color:#30334B !important; color:#F1F2FA; }
.app-shell.theme-dark .feature-card h3,.app-shell.theme-dark .insight-item strong { color:#F1F2FA !important; }
.app-shell.theme-dark .feature-card p,.app-shell.theme-dark .feature-card-meta,.app-shell.theme-dark .insight-item p { color:#AEB3C8 !important; }
.app-shell.theme-dark .inline-budget-form input { background:#24273B; color:#F1F2FA; border-color:#3A3E58; }
.app-shell.theme-dark .comparison-table th,.app-shell.theme-dark .comparison-table td { border-color:#353951; color:#D5D8E5; }
.app-shell.theme-dark .comparison-table th { color:#AEB3C8; }
.app-shell.theme-dark .goal-progress { background:#383B53; }
.app-shell.theme-dark .insight-icon { background:#302C50; color:#C0B8FF; }


/* Advanced features */
.connection-banner { display:flex; align-items:center; gap:9px; margin:-18px 0 20px; padding:9px 12px; border-radius:9px; font-size:11px; line-height:1.4; }
.connection-banner.online { background:#EAF8F3; color:#267C65; }
.connection-banner.offline { background:#FFF3E3; color:#9B641B; }
.connection-dot { width:8px; height:8px; border-radius:50%; background:currentColor; flex:0 0 8px; }
.auto-category-suggestion { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 10px; margin-top:7px; border-radius:9px; background:#F0EEFF; color:#5C52A6; font-size:11px; line-height:1.5; }
.auto-category-suggestion .secondary-button { flex-shrink:0; }
.health-hero { display:flex; align-items:center; gap:24px; padding:25px; }
.health-score-ring { --health-score:0%; width:145px; height:145px; display:grid; place-items:center; flex:0 0 145px; border-radius:50%; background:conic-gradient(#7667E8 var(--health-score),#ECEAF7 0); position:relative; }
.health-score-ring::before { content:""; position:absolute; inset:12px; border-radius:50%; background:#fff; }
.health-score-ring > div { position:relative; z-index:1; text-align:center; }
.health-score-ring strong { font:800 40px Manrope,sans-serif; display:block; line-height:1.1; }
.health-score-ring span { color:#8A90A2; font-size:11px; }
.health-summary h2 { margin:10px 0 6px; font:800 20px Manrope,sans-serif; }
.health-summary p { margin:0; color:#82899D; font-size:12px; line-height:1.7; max-width:700px; }
.health-component-score { font:800 22px Manrope,sans-serif; color:#7667E8; white-space:nowrap; }
.forecast-bars { display:grid; gap:18px; }
.forecast-bars > div { display:grid; grid-template-columns:minmax(120px,1fr) 3fr auto; align-items:center; gap:14px; color:#737B91; font-size:12px; }
.forecast-bars strong { color:#30354A; font-size:12px; white-space:nowrap; }
.forecast-fill { background:linear-gradient(90deg,#7667E8,#B7ADF5); }
.average-fill { background:linear-gradient(90deg,#36A891,#8AD2BE); }
.split-participant-list { display:grid; gap:7px; margin-top:12px; }
.split-participant { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:10px; align-items:center; padding:8px 0; border-top:1px solid #F0F1F5; font-size:11px; }
.split-participant strong { white-space:nowrap; }
.selected-feature-card { border-color:#A89EF2; box-shadow:0 0 0 2px #7667E81A; }
.assistant-disclaimer { padding:11px 13px; border-radius:9px; background:#F7F6FF; color:#69658C; font-size:11px; line-height:1.6; }
.assistant-suggestions { display:flex; gap:8px; flex-wrap:wrap; margin:13px 0; }
.assistant-chat { display:grid; gap:10px; max-height:420px; overflow-y:auto; padding:14px 0; }
.assistant-message { max-width:88%; padding:11px 13px; border-radius:12px; background:#F5F4FB; }
.assistant-message.user { margin-left:auto; background:#EFEDFF; }
.assistant-message strong { display:block; color:#7667E8; font-size:10px; margin-bottom:4px; }
.assistant-message p { margin:0; color:#4F566B; font-size:12px; line-height:1.6; white-space:pre-wrap; }
.assistant-input-row { display:flex; gap:9px; }
.assistant-input-row input { flex:1; min-width:0; height:43px; padding:0 13px; border:1px solid #E6E7F0; border-radius:10px; outline:none; }
.receipt-upload-zone { display:grid; justify-items:center; gap:8px; padding:28px 15px; border:2px dashed #DAD6F7; border-radius:14px; background:#FAF9FF; color:#68618F; text-align:center; cursor:pointer; }
.receipt-upload-zone input { display:block; margin-top:7px; max-width:100%; }
.receipt-upload-zone strong { font-size:14px; }
.receipt-upload-zone small { color:#8A90A2; font-size:11px; }
.receipt-upload-icon { font-size:30px; color:#7667E8; }
.receipt-text-details { margin-top:15px; color:#767D91; font-size:12px; }
.receipt-text-details pre { max-height:260px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; padding:12px; background:#F7F8FC; border-radius:9px; color:#52596E; }
@media(max-width:650px) { .health-hero { flex-direction:column; align-items:flex-start; } .forecast-bars > div { grid-template-columns:1fr; gap:6px; } .split-participant { grid-template-columns:minmax(0,1fr) auto; } .split-participant .status-pill { grid-column:1/-1; justify-self:start; } .assistant-message { max-width:96%; } .assistant-input-row { flex-direction:column; } }
.app-shell.theme-dark .connection-banner.online { background:#173D38; color:#8ADCC4; }
.app-shell.theme-dark .connection-banner.offline { background:#483825; color:#F5C77F; }
.app-shell.theme-dark .auto-category-suggestion,.app-shell.theme-dark .assistant-disclaimer { background:#302C50; color:#D1CBFF; }
.app-shell.theme-dark .health-score-ring::before { background:#202236; }
.app-shell.theme-dark .health-summary h2,.app-shell.theme-dark .health-component-score,.app-shell.theme-dark .forecast-bars strong { color:#F1F2FA; }
.app-shell.theme-dark .health-summary p,.app-shell.theme-dark .forecast-bars,.app-shell.theme-dark .split-participant { color:#AEB3C8; }
.app-shell.theme-dark .split-participant { border-color:#353951; }
.app-shell.theme-dark .assistant-message { background:#292C43; }
.app-shell.theme-dark .assistant-message.user { background:#302C50; }
.app-shell.theme-dark .assistant-message p { color:#DCE0EE; }
.app-shell.theme-dark .assistant-input-row input,.app-shell.theme-dark .receipt-text-details pre { background:#24273B; border-color:#3A3E58; color:#F1F2FA; }
.app-shell.theme-dark .receipt-upload-zone { background:#24243B; border-color:#565078; color:#D6D1FF; }
.app-shell.theme-dark .receipt-upload-zone small,.app-shell.theme-dark .receipt-text-details { color:#AEB3C8; }
/* Local bank-sync demonstration (sample data only; no real bank connection). */
.bank-demo-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; }
.bank-demo-card { background:#fff; border:1px solid #EFF0F5; border-radius:15px; padding:19px; min-width:0; }
.bank-demo-card h3 { margin:13px 0 5px; font:800 16px Manrope,sans-serif; color:#20243A; }
.bank-demo-card p { color:#858B9D; font-size:12px; line-height:1.55; }
.bank-demo-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.bank-demo-icon { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; background:#F0EEFF; color:#7667E8; font-size:20px; font-weight:800; }
.bank-demo-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:15px; }
.bank-demo-consent { display:flex; align-items:flex-start; gap:10px; padding:14px; background:#FAF9FF; border:1px solid #E8E5FA; border-radius:12px; margin-top:15px; color:#555B70; font-size:12px; line-height:1.55; }
.bank-demo-consent input { margin-top:3px; accent-color:#7667E8; }
.bank-demo-meta { color:#858B9D; font-size:11px; line-height:1.6; margin-top:10px; }
.bank-demo-notice { padding:13px 15px; border-radius:10px; background:#FFF7E8; border:1px solid #F5E4BF; color:#805B1C; font-size:12px; line-height:1.6; margin-bottom:16px; }
.bank-demo-success { padding:12px 14px; border-radius:10px; background:#EAF8F3; color:#258265; font-size:12px; line-height:1.5; margin-top:14px; }
.app-shell.theme-dark .bank-demo-card { background:#202236; border-color:#30334B; }
.app-shell.theme-dark .bank-demo-card h3 { color:#F1F2FA; }
.app-shell.theme-dark .bank-demo-card p,.app-shell.theme-dark .bank-demo-meta { color:#AEB3C8; }
.app-shell.theme-dark .bank-demo-icon { background:#302C50; color:#C0B8FF; }
.app-shell.theme-dark .bank-demo-consent { background:#24273B; border-color:#3A3E58; color:#D5D8E5; }
.app-shell.theme-dark .bank-demo-notice { background:#3A3021; border-color:#66502A; color:#F4D99F; }
.app-shell.theme-dark .bank-demo-success { background:#173D38; color:#7CE0C2; }
@media(max-width:1050px) { .bank-demo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:700px) { .bank-demo-grid { grid-template-columns:1fr; } }

/* Refined grouped navigation */
.nav-list { display:grid !important; grid-template-columns:minmax(0,1fr); align-content:start; gap:8px !important; max-height:calc(100vh - 260px) !important; min-height:0 !important; padding:0 2px 8px; }
.nav-group { min-width:0; }
.nav-group-toggle { width:100%; display:flex; align-items:center; gap:10px; border:1px solid transparent; border-radius:10px; padding:10px 11px; background:transparent; color:#70778B; text-align:left; font:700 12px 'DM Sans',sans-serif; transition:background .18s ease,color .18s ease,border-color .18s ease; }
.nav-group-toggle:hover,.nav-group-toggle.contains-active { background:#F3F1FF; color:#6656D5; }
.nav-group-icon { width:20px; text-align:center; font-size:16px; color:#8173E8; }
.nav-group-name { flex:1; min-width:0; }
.nav-group-chevron { color:#A3A7B7; font-size:17px; line-height:1; transform:rotate(-90deg); transition:transform .18s ease; }
.nav-group-chevron.expanded { transform:rotate(0deg); }
.nav-sublist { display:grid; gap:3px; padding:4px 0 5px 10px; margin-left:9px; border-left:1px solid #E9E6FC; }
.nav-button.nav-sub-button { padding:9px 10px; gap:10px; font-size:12px; border-radius:9px; }
.nav-button.nav-sub-button .nav-icon { width:18px; font-size:15px; }
.nav-group-single .nav-button { padding:11px 12px; }
.app-shell.theme-dark .nav-group-toggle { color:#B8BCD0; }
.app-shell.theme-dark .nav-group-toggle:hover,.app-shell.theme-dark .nav-group-toggle.contains-active { background:#302C50; color:#D0CAFF; }
.app-shell.theme-dark .nav-sublist { border-left-color:#4A456D; }
@media(max-width:800px) {
  .nav-list { grid-template-columns:repeat(2,minmax(0,1fr)) !important; max-height:none !important; overflow:visible !important; }
  .sidebar { gap:8px; }
  .nav-group-toggle { font-size:12px; padding:10px 9px; }
}
@media(max-width:480px) { .nav-list { grid-template-columns:1fr !important; } }

/* More expressive statistics and chart colour */
.stat-card { border-top:4px solid var(--stat-accent,#7667E8) !important; background:linear-gradient(145deg,var(--stat-tint,#EFEDFF) 0%,#FFFFFF 76%) !important; box-shadow:0 8px 22px rgba(44,49,84,.045); transition:transform .18s ease,box-shadow .18s ease; }
.stat-card:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(44,49,84,.085); }
.stat-card .stat-icon { box-shadow:inset 0 0 0 1px rgba(255,255,255,.72),0 4px 12px rgba(25,35,65,.08); }
.bar-chart { border-radius:13px; background-image:linear-gradient(to top,rgba(112,120,150,.09) 1px,transparent 1px); background-size:100% 25%; padding-left:10px; padding-right:10px; }
.bar { min-width:14px; border-radius:7px 7px 3px 3px; box-shadow:0 4px 10px rgba(39,48,85,.12); transition:height .3s ease,filter .2s ease; }
.bar:hover { filter:saturate(1.25) brightness(1.04); }
.bar.income-bar { background:linear-gradient(180deg,#5EEAD4 0%,#0D9488 100%) !important; }
.bar.expense-bar { background:linear-gradient(180deg,#FDA4AF 0%,#F43F5E 100%) !important; }
.chart-legend .legend-dot { box-shadow:0 0 0 3px rgba(120,120,160,.09); }
.category-list .progress-track { height:7px; background:#EEF0F7; }
.category-list .progress-fill { border-radius:20px; box-shadow:0 2px 7px rgba(40,45,80,.14); }
.app-shell.theme-dark .stat-card { background:linear-gradient(145deg,#292C43 0%,#202236 78%) !important; box-shadow:0 8px 22px rgba(0,0,0,.12); }
.app-shell.theme-dark .bar-chart { background-image:linear-gradient(to top,rgba(210,214,240,.09) 1px,transparent 1px); }
.app-shell.theme-dark .category-list .progress-track { background:#383B53; }

/* Support Centre */
.support-hero { display:flex; align-items:center; gap:18px; padding:22px 24px; margin-bottom:17px; border:1px solid #E7E3FF; border-radius:17px; background:linear-gradient(115deg,#F0EDFF 0%,#FDF1F7 52%,#E8F8F5 100%); }
.support-hero-icon { width:55px; height:55px; display:grid; place-items:center; border-radius:17px; background:linear-gradient(140deg,#7657F6,#B06AF2); color:#fff; font-size:27px; box-shadow:0 8px 18px rgba(118,87,246,.24); flex:0 0 55px; }
.support-eyebrow { color:#7866D8; font-size:10px; font-weight:800; letter-spacing:1.4px; }
.support-hero h2 { margin:4px 0; color:#302B54; font:800 22px Manrope,sans-serif; }
.support-hero p { margin:0; color:#74758E; font-size:12px; line-height:1.6; }
.support-tabs { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 15px; }
.support-tabs button { display:inline-flex; align-items:center; gap:8px; border:1px solid #E8E8F0; border-radius:10px; padding:10px 14px; background:#fff; color:#73798D; font:700 12px 'DM Sans',sans-serif; }
.support-tabs button:hover { border-color:#BEB6F7; color:#6656D5; }
.support-tabs button.active { background:#7667E8; border-color:#7667E8; color:#fff; box-shadow:0 5px 14px rgba(118,103,232,.2); }
.support-count { display:inline-grid; place-items:center; min-width:20px; height:20px; padding:0 5px; border-radius:20px; background:#F0EEFF; color:#6656D5; font-size:10px; }
.support-tabs button.active .support-count { background:rgba(255,255,255,.2); color:#fff; }
.support-form-panel,.support-requests-panel { padding:22px; }
.support-form-panel .form-field textarea { width:100%; min-height:150px; resize:vertical; padding:11px 12px; border:1px solid #E9EAF1; border-radius:9px; background:#FAFAFC; color:#35394D; outline:none; font:13px 'DM Sans',sans-serif; }
.support-form-panel .form-field textarea:focus { border-color:#9A8FF0; }
.support-character-count { display:block; text-align:right; color:#969BAC; font-size:10px; margin-top:-2px; }
.support-privacy-note { padding:12px 14px; border-radius:10px; background:#F2F8FF; border:1px solid #DCEBFA; color:#59708C; font-size:11px; line-height:1.6; }
.support-privacy-note strong { color:#365D84; }
.support-submit-row { display:flex; justify-content:flex-end; margin-top:16px; }
.support-notice { border-radius:9px; padding:11px 13px; margin:13px 0 0; font-size:12px; line-height:1.5; }
.support-notice.success { background:#E8F8F1; color:#187B5A; }
.support-notice.error { background:#FFF0F0; color:#B8324A; }
.support-delivery-note { color:#9297A8; font-size:11px; line-height:1.6; margin:12px 2px 0; }
.support-request-list { display:grid; gap:12px; }
.support-request-card { padding:16px; border:1px solid #EAEAF2; border-radius:13px; background:linear-gradient(140deg,#fff 0%,#FBFAFF 100%); }
.support-request-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.support-request-top h3 { margin:8px 0 4px; color:#30354A; font:800 14px Manrope,sans-serif; }
.support-request-top p { margin:0; color:#9297A8; font-size:10px; line-height:1.5; }
.support-type-pill { display:inline-flex; border-radius:30px; padding:5px 9px; font-size:9px; font-weight:800; }
.support-type-pill.issue { background:#FFF0F1; color:#C84D63; }
.support-type-pill.contact { background:#EEF0FF; color:#6656D5; }
.support-request-message { margin:13px 0 0; padding-top:12px; border-top:1px solid #F0F0F5; color:#626A7F; font-size:12px; line-height:1.7; white-space:pre-wrap; overflow-wrap:anywhere; }
        .support-admin-reply { margin-top:14px; padding:13px 15px; border:1px solid #D9F0E7; border-radius:11px; background:#F0FAF5; }
        .support-admin-reply strong { color:#187B5A; font-size:11px; }
        .support-admin-reply p { margin:7px 0; color:#385E52; font-size:12px; line-height:1.65; white-space:pre-wrap; }
        .support-admin-reply small { color:#7C9B8F; font-size:10px; }
        .status-pill.info { background:#EAF3FF; color:#2866B2; }
        .app-shell.theme-dark .support-admin-reply { background:#193B35; border-color:#285B4E; }
        .app-shell.theme-dark .support-admin-reply strong { color:#8ADCC4; }
        .app-shell.theme-dark .support-admin-reply p { color:#C2E8DB; }
        .app-shell.theme-dark .support-admin-reply small { color:#8DB9A9; }
        .app-shell.theme-dark .status-pill.info { background:#203B5A; color:#A9D0FF; }
.support-empty-state { display:grid; justify-items:center; gap:8px; padding:36px 15px; text-align:center; color:#8A90A2; }
.support-empty-state > span { width:46px; height:46px; display:grid; place-items:center; border-radius:15px; background:#F0EEFF; color:#7667E8; font-size:22px; }
.support-empty-state strong { color:#454B61; font-size:14px; }
.support-empty-state p { margin:0 0 5px; font-size:11px; }
.app-shell.theme-dark .support-hero { background:linear-gradient(115deg,#302C50 0%,#3B293F 52%,#1F3C3A 100%); border-color:#484365; }
.app-shell.theme-dark .support-hero h2,.app-shell.theme-dark .support-empty-state strong { color:#F1F2FA; }
.app-shell.theme-dark .support-hero p,.app-shell.theme-dark .support-request-top p,.app-shell.theme-dark .support-delivery-note { color:#AEB3C8; }
.app-shell.theme-dark .support-eyebrow { color:#C0B8FF; }
.app-shell.theme-dark .support-tabs button { background:#24273B; color:#C5C9D9; border-color:#3A3E58; }
.app-shell.theme-dark .support-tabs button.active { background:#6658D5; border-color:#8073ED; color:#fff; }
.app-shell.theme-dark .support-count { background:#302C50; color:#D0CAFF; }
.app-shell.theme-dark .support-tabs button.active .support-count { background:rgba(255,255,255,.2); color:#fff; }
.app-shell.theme-dark .support-form-panel .form-field textarea { background:#292C43; color:#F1F2FA; border-color:#3A3E58; }
.app-shell.theme-dark .support-privacy-note { background:#202E45; border-color:#344A69; color:#C1D6EE; }
.app-shell.theme-dark .support-privacy-note strong { color:#E0EDFC; }
.app-shell.theme-dark .support-request-card { background:linear-gradient(140deg,#202236 0%,#25243D 100%); border-color:#3A3E58; }
.app-shell.theme-dark .support-request-top h3 { color:#F1F2FA; }
.app-shell.theme-dark .support-request-message { color:#C7CBD9; border-color:#353951; }
.app-shell.theme-dark .support-type-pill.issue { background:#482A39; color:#FFB5C2; }
.app-shell.theme-dark .support-type-pill.contact { background:#302C50; color:#D0CAFF; }
.app-shell.theme-dark .support-notice.success { background:#173D38; color:#8ADCC4; }
.app-shell.theme-dark .support-notice.error { background:#482A39; color:#FFB5C2; }
.app-shell.theme-dark .support-empty-state > span { background:#302C50; color:#D0CAFF; }
@media(max-width:650px) {
  .support-hero { align-items:flex-start; padding:17px; }
  .support-hero-icon { width:44px; height:44px; flex-basis:44px; border-radius:13px; }
  .support-hero h2 { font-size:19px; }
  .support-form-panel,.support-requests-panel { padding:15px; }
  .support-request-top { flex-direction:column; }
  .support-tabs button { flex:1 1 auto; justify-content:center; }
}
`

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "expense", icon: "◉" },
  { name: "Shopping", type: "expense", icon: "◇" },
  { name: "Transport", type: "expense", icon: "↗" },
  { name: "Education", type: "expense", icon: "▤" },
  { name: "Entertainment", type: "expense", icon: "♫" },
  { name: "Bills", type: "expense", icon: "▣" },
  { name: "Health", type: "expense", icon: "✚" },
  { name: "Travel", type: "expense", icon: "✈" },
  { name: "Salary", type: "income", icon: "↗" },
  { name: "Freelance", type: "income", icon: "✦" },
  { name: "Investment", type: "income", icon: "◈" },
  { name: "Other", type: "both", icon: "○" },
];

const DEMO_BANK_PROVIDERS = [
  {
    id: "finpilot-demo-bank",
    name: "FinPilot Demo Bank",
    shortName: "FDB",
    description: "Sample savings account with salary, UPI, card and bill activity.",
    openingBalance: 28500,
    transactions: [
      { id: "salary-credit", title: "Monthly Salary", type: "income", category: "Salary", amount: 42000, daysAgo: 12, note: "Sample salary credit" },
      { id: "grocery-upi", title: "Fresh Mart Groceries", type: "expense", category: "Food", amount: 1280.50, daysAgo: 10, note: "Sample UPI debit" },
      { id: "electricity-bill", title: "Electricity Bill", type: "expense", category: "Bills", amount: 1840, daysAgo: 8, note: "Sample bill payment" },
      { id: "cab-payment", title: "City Cab", type: "expense", category: "Transport", amount: 365, daysAgo: 5, note: "Sample card debit" },
      { id: "online-refund", title: "Online Store Refund", type: "income", category: "Other", amount: 799, daysAgo: 3, note: "Sample merchant refund" },
      { id: "pharmacy", title: "Neighbourhood Pharmacy", type: "expense", category: "Health", amount: 540, daysAgo: 1, note: "Sample UPI debit" },
    ],
  },
  {
    id: "sample-national-bank",
    name: "Sample National Bank",
    shortName: "SNB",
    description: "Mock current account with business and household transactions.",
    openingBalance: 61500,
    transactions: [
      { id: "client-payment", title: "Client Payment", type: "income", category: "Freelance", amount: 12500, daysAgo: 13, note: "Sample NEFT credit" },
      { id: "internet-bill", title: "Internet Bill", type: "expense", category: "Bills", amount: 999, daysAgo: 11, note: "Sample auto-debit" },
      { id: "course-fee", title: "Online Course Fee", type: "expense", category: "Education", amount: 2499, daysAgo: 7, note: "Sample card debit" },
      { id: "restaurant", title: "Cafe Payment", type: "expense", category: "Food", amount: 680, daysAgo: 2, note: "Sample UPI debit" },
    ],
  },
  {
    id: "demo-digital-bank",
    name: "Demo Digital Bank",
    shortName: "DDB",
    description: "Mock digital account with subscription and transfer-like activity.",
    openingBalance: 14750,
    transactions: [
      { id: "cashback", title: "Card Cashback", type: "income", category: "Other", amount: 125, daysAgo: 9, note: "Sample cashback credit" },
      { id: "streaming", title: "Streaming Subscription", type: "expense", category: "Entertainment", amount: 299, daysAgo: 6, note: "Sample recurring debit" },
      { id: "shopping", title: "Online Shopping", type: "expense", category: "Shopping", amount: 2199, daysAgo: 4, note: "Sample card debit" },
      { id: "fuel", title: "Fuel Station", type: "expense", category: "Transport", amount: 1500, daysAgo: 1, note: "Sample card debit" },
    ],
  },
];

const COLORS = ["#7657F6", "#14B8A6", "#F59E0B", "#F472B6", "#3B82F6", "#F97316", "#8B5CF6", "#22C55E"];
const toLocalDateInput = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const getDate = () => toLocalDateInput(new Date());
const money = (amount, currencyCode = "INR", rate = 1) => {
  const numericAmount = Number(amount) || 0;
  const safeRate = Number(rate);
  const convertedAmount = numericAmount * (Number.isFinite(safeRate) && safeRate > 0 ? safeRate : 1);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  } catch {
    return `${convertedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${currencyCode}`;
  }
};

const currencyName = (code) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) || code;
  } catch {
    return code;
  }
};

const currencySymbol = (code) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code })
      .formatToParts(1)
      .find((part) => part.type === "currency")?.value || code;
  } catch {
    return code;
  }
};

const FX_CACHE_KEY = "finpilot_fx_rates_inr_v1";
const FX_RATES_URL = "https://open.er-api.com/v6/latest/INR";

function formatDate(date, format = "dd MMM yyyy") {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  if (format === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonthKey(monthKey, offset) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return getMonthKey(date);
}

function monthLabel(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? monthKey
    : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function categoryBudgetDocId(categoryName) {
  return encodeURIComponent(String(categoryName || "").trim().toLowerCase());
}

function advanceRecurringDate(dateValue, frequency, anchorDay) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  if (!year || !month || !day) return dateValue;
  if (frequency === "weekly") {
    const date = new Date(year, month - 1, day + 7);
    return toLocalDateInput(date);
  }
  if (frequency === "yearly") {
    const targetYear = year + 1;
    const safeDay = Math.min(day, new Date(targetYear, month, 0).getDate());
    return `${targetYear}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  }
  // Monthly schedules keep the original day where possible (e.g. 31st -> month end).
  const nextMonth = new Date(year, month, 1);
  const nextYear = nextMonth.getFullYear();
  const nextMonthNumber = nextMonth.getMonth() + 1;
  const dayToUse = Math.min(Number(anchorDay) || day, new Date(nextYear, nextMonthNumber, 0).getDate());
  return `${nextYear}-${String(nextMonthNumber).padStart(2, "0")}-${String(dayToUse).padStart(2, "0")}`;
}

function summarizeTransactions(items, getAmount = (item) => Number(item.amount) || 0) {
  const income = items.filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (Number(getAmount(item)) || 0), 0);
  const expenses = items.filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (Number(getAmount(item)) || 0), 0);
  return { income, expenses, savings: income - expenses, count: items.length };
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function categoryOrderKey(item) {
  return item.custom ? `custom:${item.id}` : `default:${item.name}`;
}

function sortCategoriesByPreference(items, savedOrder = []) {
  const positions = new Map(savedOrder.map((key, index) => [key, index]));
  return items.map((item, index) => ({ item, index })).sort((left, right) => {
    const leftPosition = positions.get(categoryOrderKey(left.item));
    const rightPosition = positions.get(categoryOrderKey(right.item));
    if (leftPosition === undefined && rightPosition === undefined) return left.index - right.index;
    if (leftPosition === undefined) return 1;
    if (rightPosition === undefined) return -1;
    return leftPosition - rightPosition;
  }).map(({ item }) => item);
}


function inferTransactionCategory(title, type, categories) {
  const text = String(title || "").toLowerCase();
  if (!text.trim()) return null;
  const rules = type === "income" ? [
    { category: "Salary", words: ["salary", "payroll", "wage", "pay day"] },
    { category: "Freelance", words: ["freelance", "client", "project payment", "contract"] },
    { category: "Investment", words: ["dividend", "interest", "mutual fund", "stock", "investment"] },
  ] : [
    { category: "Food", words: ["grocery", "groceries", "restaurant", "cafe", "coffee", "food", "swiggy", "zomato", "dinner", "lunch", "snack"] },
    { category: "Transport", words: ["uber", "ola", "cab", "taxi", "metro", "bus", "train", "fuel", "petrol", "diesel", "parking"] },
    { category: "Bills", words: ["electricity", "water bill", "gas bill", "internet", "wifi", "mobile recharge", "phone bill", "rent", "subscription", "emi"] },
    { category: "Shopping", words: ["amazon", "flipkart", "shopping", "clothes", "clothing", "shoes", "skincare", "cosmetic"] },
    { category: "Education", words: ["course", "tuition", "college", "school", "book", "books", "exam", "education"] },
    { category: "Health", words: ["doctor", "hospital", "medicine", "pharmacy", "medical", "health"] },
    { category: "Entertainment", words: ["movie", "cinema", "netflix", "spotify", "game", "concert", "entertainment"] },
    { category: "Travel", words: ["hotel", "flight", "airbnb", "trip", "travel", "holiday"] },
  ];
  const found = rules.find((rule) => rule.words.some((word) => text.includes(word)));
  if (!found) return null;
  const category = categories.find((item) => item.name.toLowerCase() === found.category.toLowerCase());
  return category ? { name: category.name, reason: `Matched keywords related to ${category.name.toLowerCase()}.` } : null;
}

function clampNumber(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function parseOcrReceipt(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const totalLine = lines.find((line) => /grand\s*total|amount\s*paid|total\s*amount|net\s*amount|\btotal\b/i.test(line));
  const numberPattern = /(?:₹|Rs\.?|INR|\$|USD|€|£)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;
  const extractNumbers = (line) => [...String(line || "").matchAll(numberPattern)]
    .map((match) => Number(String(match[1]).replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100000000);
  const totalCandidates = extractNumbers(totalLine);
  const allCandidates = lines.flatMap(extractNumbers);
  const amount = totalCandidates.length ? totalCandidates[totalCandidates.length - 1]
    : allCandidates.length ? Math.max(...allCandidates) : null;
  const dateMatch = String(text || "").match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  let date = "";
  if (dateMatch) {
    let [, day, month, year] = dateMatch;
    if (year.length === 2) year = `20${year}`;
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const parsed = new Date(`${candidate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() === Number(year)
      && parsed.getMonth() + 1 === Number(month) && parsed.getDate() === Number(day)) date = candidate;
  }
  const title = lines.find((line) => line.length >= 3 && !/^(tax invoice|receipt|invoice|cash memo)$/i.test(line)) || "Receipt purchase";
  return { title: title.slice(0, 100), amount: amount === null ? "" : amount.toFixed(2), date };
}


function safeDocumentId(value) {
  return String(value || "item")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "item";
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell); cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => String(value).trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => String(value).trim() !== "")) rows.push(row);
  return rows;
}


function normalizeStatementDate(value) {
  const input = String(value || "").trim().replace(/,/g, " ").replace(/\s+/g, " ");
  if (!input) return "";
  let year, month, day;
  let match = input.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) [, year, month, day] = match;
  if (!match) {
    match = input.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (match) {
      // Indian bank statements commonly use DD/MM/YYYY or DD-MM-YYYY.
      [, day, month, year] = match;
      if (year.length === 2) year = `20${year}`;
    }
  }
  if (!match) {
    match = input.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s-](\d{2,4})$/);
    if (match) {
      const months = { jan:1, january:1, feb:2, february:2, mar:3, march:3, apr:4, april:4, may:5, jun:6, june:6, jul:7, july:7, aug:8, august:8, sep:9, sept:9, september:9, oct:10, october:10, nov:11, november:11, dec:12, december:12 };
      day = match[1]; month = months[match[2].toLowerCase()]; year = match[3];
      if (String(year).length === 2) year = `20${year}`;
    }
  }
  if (!year || !month || !day) return "";
  const y = Number(year), m = Number(month), d = Number(day);
  const candidate = new Date(y, m - 1, d);
  if (!Number.isFinite(candidate.getTime()) || candidate.getFullYear() !== y || candidate.getMonth() + 1 !== m || candidate.getDate() !== d) return "";
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function parseStatementNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /^[-—–]+$/.test(raw)) return 0;
  const negativeByParentheses = /^\(.*\)$/.test(raw);
  const cleaned = raw
    .replace(/\b(?:INR|USD|EUR|GBP|BDT|XAF|AED|CAD|AUD|JPY)\b/gi, "")
    .replace(/[₹$€£৳]/g, "")
    .replace(/\b(?:CR|DR)\b/gi, "")
    .replace(/,/g, "")
    .replace(/[()\s]/g, "")
    .replace(/[^0-9.+-]/g, "");
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return NaN;
  return negativeByParentheses ? -Math.abs(number) : number;
}

function detectStatementCurrency(text, fallback = "INR") {
  const value = String(text || "");
  if (/\b(?:INR|Rs\.?|Indian Rupees?)\b|₹/i.test(value)) return "INR";
  if (/\bUSD\b|\$/i.test(value)) return "USD";
  if (/\bEUR\b|€/i.test(value)) return "EUR";
  if (/\bGBP\b|£/i.test(value)) return "GBP";
  if (/\bBDT\b|৳/i.test(value)) return "BDT";
  if (/\bAED\b/i.test(value)) return "AED";
  if (/\bCAD\b/i.test(value)) return "CAD";
  if (/\bAUD\b/i.test(value)) return "AUD";
  if (/\bJPY\b|¥/i.test(value)) return "JPY";
  if (/\bXAF\b/i.test(value)) return "XAF";
  return String(fallback || "INR").toUpperCase();
}

function parseStatementPdfLines(lines, fallbackCurrency = "INR", fallbackAccount = "Bank Account") {
  const valid = [];
  const errors = [];
  const datePattern = /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[ -][A-Za-z]{3,9}[ -]\d{2,4})\b/g;
  const amountPattern = /(?:₹|Rs\.?|INR|USD|\$|EUR|€|GBP|£|BDT|৳)?\s*\(?-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?\)?\s*(?:CR|DR)?/gi;
  const transactionLines = [];
  let current = null;
  let sourceRow = 0;
  for (const originalLine of lines) {
    const line = String(originalLine || "").replace(/\s+/g, " ").trim();
    if (!line) continue;
    const dates = [...line.matchAll(datePattern)];
    if (dates.length) {
      if (current) transactionLines.push(current);
      sourceRow += 1;
      current = { row: sourceRow, text: line };
    } else if (current && line.length < 180 && !/^(page\s+\d+|continued|statement\s+of|opening\s+balance|closing\s+balance)$/i.test(line)) {
      // Bank statements often wrap a narration onto the following visual line.
      current.text += ` ${line}`;
    }
  }
  if (current) transactionLines.push(current);

  transactionLines.forEach((entry) => {
    const text = entry.text;
    const dateMatches = [...text.matchAll(datePattern)];
    const date = dateMatches.length ? normalizeStatementDate(dateMatches[0][0]) : "";
    const withoutDates = text.replace(datePattern, " ");
    const matches = [...withoutDates.matchAll(amountPattern)];
    const tokens = matches.map((match) => ({ raw: match[0].trim(), value: parseStatementNumber(match[0]), index: match.index ?? 0 }))
      .filter((item) => Number.isFinite(item.value) && item.value !== 0)
      .filter((item) => /[.,₹$€£৳]|\b(?:INR|USD|EUR|GBP|BDT|AED|CAD|AUD|JPY|XAF|CR|DR)\b/i.test(item.raw) || Math.abs(item.value) < 1000000);
    const explicitCredit = /\b(?:CR|CREDIT|DEPOSIT|DEPOSITED|CREDITED)\b/i.test(text);
    const explicitDebit = /\b(?:DR|DEBIT|WITHDRAWAL|WITHDRAWN|DEBITED)\b/i.test(text);
    const incomeHint = /\b(?:salary|interest credited|refund|cashback|dividend|deposit|credit)\b/i.test(text);
    const debitHint = /\b(?:purchase|payment|withdrawal|transfer to|debit)\b/i.test(text);
    let amountCandidates = tokens;
    // In common statements the final monetary column is the running balance.
    if (amountCandidates.length >= 2) amountCandidates = amountCandidates.slice(0, -1);
    const selectedToken = amountCandidates.find((item) => Math.abs(item.value) > 0) || tokens[0];
    const amount = selectedToken ? Math.abs(selectedToken.value) : 0;
    const type = explicitCredit || (!explicitDebit && incomeHint && !debitHint) ? "income" : "expense";

    let title = withoutDates;
    // Remove detected money values from the narration so balances do not leak into descriptions.
    for (const item of [...matches].reverse()) {
      const start = item.index ?? 0;
      title = `${title.slice(0, start)} ${title.slice(start + item[0].length)}`;
    }
    title = title.replace(/\b(?:CR|DR|CREDIT|DEBIT|WITHDRAWAL|DEPOSIT|BALANCE|VALUE\s*DATE|TRANSACTION\s*DATE)\b/gi, " ")
      .replace(/\b\d{6,}\b/g, " ")
      .replace(/[|;:_]+/g, " ").replace(/\s+/g, " ").trim();
    title = title.replace(/^(?:UPI|NEFT|IMPS|RTGS|POS|ATM|ACH)\s*[-/:]*\s*/i, (prefix) => prefix.trim());
    if (title.length > 100) title = title.slice(0, 100).trim();
    const reason = !date ? "Could not interpret the transaction date." : date > toLocalDateInput(new Date()) ? "Future-dated transactions are not allowed." : !title || title.length < 2 ? "Could not identify a transaction description." : !(amount > 0) ? "Could not identify a reliable transaction amount." : null;
    if (reason) errors.push({ row: entry.row, reason, raw: text.slice(0, 240) });
    else valid.push({ date, title, amount: Number(amount.toFixed(2)), type, category: "Other", account: fallbackAccount, currencyCode: fallbackCurrency, note: "Imported from PDF bank statement; please verify the source row." });
  });
  return { valid, errors, detectedRows: transactionLines.length };
}

function stableHash(value) {
  let hash = 2166136261;
  const input = String(value || "");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const SUPPORT_ADMIN_UID = "Brqb0uSw06U50SeBYMm9U4ln9DT2";

const NAV_GROUPS = [
  { name: "Overview", icon: "▦", items: [{ name: "Dashboard", icon: "▦" }] },
  { name: "Money Management", icon: "◈", items: [
    { name: "Accounts", icon: "▣" },
    { name: "Bank Sync Demo", icon: "⇄" },
    { name: "Transactions", icon: "↕" },
    { name: "Statement Import", icon: "⇧" },
    { name: "Categories", icon: "◇" },
  ] },
  { name: "Planning", icon: "◫", items: [
    { name: "Budgets", icon: "◫" },
    { name: "Savings Goals", icon: "◎" },
    { name: "Recurring", icon: "↻" },
    { name: "Reminders", icon: "◷" },
  ] },
  { name: "Analysis & Insights", icon: "▥", items: [
    { name: "Reports", icon: "▥" },
    { name: "Insights", icon: "✦" },
    { name: "Financial Health", icon: "♥" },
    { name: "Forecast", icon: "⌁" },
    { name: "Achievements", icon: "★" },
  ] },
  { name: "Tools & Collaboration", icon: "✧", items: [
    { name: "Split Expenses", icon: "⇄" },
    { name: "Shared Budgets", icon: "♧" },
    { name: "Assistant", icon: "✧" },
    { name: "Receipt Scanner", icon: "▧" },
  ] },
  { name: "Account & Help", icon: "◎", items: [
    { name: "Profile", icon: "◎" },
    { name: "Settings", icon: "⚙" },
    { name: "Support Centre", icon: "♡" },
  ] },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: "", type: "bank", currencyCode: "INR", openingBalance: "0", openingBalanceDate: getDate() });
  const [transferForm, setTransferForm] = useState({ fromAccountId: "", toAccountId: "", amount: "100", date: getDate(), note: "" });
  const [bankSyncDemoConnections, setBankSyncDemoConnections] = useState([]);
  const [bankDemoConsentAccepted, setBankDemoConsentAccepted] = useState(false);
  const [bankDemoBusyId, setBankDemoBusyId] = useState("");
  const [bankDemoMessage, setBankDemoMessage] = useState("");
  const [csvImportFileName, setCsvImportFileName] = useState("");
  const [csvImportRows, setCsvImportRows] = useState([]);
  const [csvImportErrors, setCsvImportErrors] = useState([]);
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const [statementParsing, setStatementParsing] = useState(false);
  const [statementProgress, setStatementProgress] = useState(0);
  const [backupExporting, setBackupExporting] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState("");
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState({ expense: [], income: [] });
  const [categoryOrderSaving, setCategoryOrderSaving] = useState(false);
  const [draggingCategory, setDraggingCategory] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const categoryDragRef = useRef(null);
  const categoryDropRef = useRef(null);
  const [budget, setBudget] = useState(16000);
  const [budgetCurrencyCode, setBudgetCurrencyCode] = useState("INR");
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categoryBudgetDrafts, setCategoryBudgetDrafts] = useState({});
  const [categoryBudgetSaving, setCategoryBudgetSaving] = useState("");
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [contributionSaving, setContributionSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "100", deadline: "", description: "" });
  const [contributionAmount, setContributionAmount] = useState("100");
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [recurringSaving, setRecurringSaving] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ title: "", type: "expense", category: "Bills", amount: "100", account: "Bank Account", frequency: "monthly", nextDueDate: getDate(), note: "" });
  const [billReminders, setBillReminders] = useState([]);
  const [billReminderModalOpen, setBillReminderModalOpen] = useState(false);
  const [editingBillReminderId, setEditingBillReminderId] = useState(null);
  const [billReminderSaving, setBillReminderSaving] = useState(false);
  const [billReminderForm, setBillReminderForm] = useState({ title: "", amount: "100", dueDate: getDate(), category: "Bills", account: "Bank Account", note: "" });
  const [splitExpenses, setSplitExpenses] = useState([]);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitSaving, setSplitSaving] = useState(false);
  const [splitForm, setSplitForm] = useState({ title: "", amount: "100", date: getDate(), category: "Food", participants: "" });
  const [ownedSharedBudgets, setOwnedSharedBudgets] = useState([]);
  const [invitedSharedBudgets, setInvitedSharedBudgets] = useState([]);
  const [selectedSharedBudgetId, setSelectedSharedBudgetId] = useState("");
  const [sharedBudgetEntries, setSharedBudgetEntries] = useState([]);
  const [sharedBudgetModalOpen, setSharedBudgetModalOpen] = useState(false);
  const [sharedBudgetSaving, setSharedBudgetSaving] = useState(false);
  const [sharedBudgetForm, setSharedBudgetForm] = useState({ name: "", monthlyLimit: "100", memberEmails: "", description: "" });
  const [sharedExpenseModalOpen, setSharedExpenseModalOpen] = useState(false);
  const [sharedExpenseSaving, setSharedExpenseSaving] = useState(false);
  const [sharedExpenseForm, setSharedExpenseForm] = useState({ title: "", amount: "100", date: getDate(), category: "Other", note: "" });
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [receiptScanning, setReceiptScanning] = useState(false);
  const [receiptProgress, setReceiptProgress] = useState(0);
  const [receiptText, setReceiptText] = useState("");
  const [receiptDraft, setReceiptDraft] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [selectedComparisonMonth, setSelectedComparisonMonth] = useState(getMonthKey(new Date()));
  const [theme, setTheme] = useState("light");
  const [savedTheme, setSavedTheme] = useState("light");
  const [dateFormat, setDateFormat] = useState("dd MMM yyyy");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [draftTheme, setDraftTheme] = useState("light");
  const [draftDateFormat, setDraftDateFormat] = useState("dd MMM yyyy");
  const [draftCurrencyCode, setDraftCurrencyCode] = useState("INR");
  const [monthlyBudgetDraft, setMonthlyBudgetDraft] = useState("100");
  const [exchangeRates, setExchangeRates] = useState({ INR: 1 });
  const [ratesUpdatedUnix, setRatesUpdatedUnix] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [settingsReady, setSettingsReady] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [expandedNavGroups, setExpandedNavGroups] = useState({ "Money Management": true });
  const [supportMode, setSupportMode] = useState("issue");
  const [supportForm, setSupportForm] = useState({ category: "Bug or error", subject: "", message: "" });
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportRequestsLoading, setSupportRequestsLoading] = useState(false);
  const [supportRequestsError, setSupportRequestsError] = useState("");
  const [adminSupportRequests, setAdminSupportRequests] = useState([]);
  const [adminSupportLoading, setAdminSupportLoading] = useState(false);
  const [adminSupportError, setAdminSupportError] = useState("");
  const [adminReplyDrafts, setAdminReplyDrafts] = useState({});
  const [adminStatusDrafts, setAdminStatusDrafts] = useState({});
  const [adminSavingRequestId, setAdminSavingRequestId] = useState("");
  const [adminSupportFilter, setAdminSupportFilter] = useState("All");
  const [adminSupportNotice, setAdminSupportNotice] = useState(null);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportNotice, setSupportNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false);
  const [profilePhotoPreviewOpen, setProfilePhotoPreviewOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCountry, setProfileCountry] = useState("India");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [profilePhotoData, setProfilePhotoData] = useState("");
  const profilePhotoInputRef = useRef(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense" });
  const [form, setForm] = useState({
    title: "", type: "expense", category: "Food", amount: "100", date: getDate(), account: "UPI", note: "",
  });

  // Load daily INR-based reference rates. Cache them locally until the provider's next update.
  useEffect(() => {
    let active = true;
    let cachedRates = null;

    try {
      const cached = readStorage(FX_CACHE_KEY, null);
      if (cached && cached.rates && typeof cached.rates === "object") {
        cachedRates = cached;
        setExchangeRates({ INR: 1, ...cached.rates });
        setRatesUpdatedUnix(Number(cached.lastUpdateUnix) || null);
      }
    } catch (error) {
      console.warn("Could not read cached currency rates:", error);
    }

    const cacheIsFresh = cachedRates && Number(cachedRates.nextUpdateUnix) * 1000 > Date.now();
    if (cacheIsFresh) {
      setRatesLoading(false);
      return () => { active = false; };
    }

    const loadRates = async () => {
      try {
        const response = await fetch(FX_RATES_URL, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Exchange-rate request failed (${response.status}).`);
        const data = await response.json();
        if (data.result !== "success" || data.base_code !== "INR" || !data.rates || typeof data.rates !== "object") {
          throw new Error("The exchange-rate provider returned an unexpected response.");
        }
        const normalizedRates = { INR: 1 };
        Object.entries(data.rates).forEach(([code, rate]) => {
          const numericRate = Number(rate);
          if (/^[A-Z]{3}$/.test(code) && Number.isFinite(numericRate) && numericRate > 0) {
            normalizedRates[code] = numericRate;
          }
        });
        if (active) {
          setExchangeRates(normalizedRates);
          setRatesUpdatedUnix(Number(data.time_last_update_unix) || Math.floor(Date.now() / 1000));
          setRatesError("");
        }
        try {
          localStorage.setItem(FX_CACHE_KEY, JSON.stringify({
            rates: normalizedRates,
            lastUpdateUnix: Number(data.time_last_update_unix) || Math.floor(Date.now() / 1000),
            nextUpdateUnix: Number(data.time_next_update_unix) || Math.floor(Date.now() / 1000) + 86400,
          }));
        } catch (error) {
          console.warn("Could not cache exchange rates:", error);
        }
      } catch (error) {
        console.error("Currency-rate loading error:", error);
        if (active) {
          setRatesError(cachedRates
            ? "Using previously saved rates because the latest rates could not be refreshed."
            : "Exchange rates could not be loaded. INR will remain available until a connection is restored.");
        }
      } finally {
        if (active) setRatesLoading(false);
      }
    };

    loadRates();
    return () => { active = false; };
  }, []);

  // Apply the selected theme to the whole document, not only the dashboard shell.
  useEffect(() => {
    document.documentElement.dataset.finpilotTheme = theme;
    document.body.dataset.finpilotTheme = theme;
    return () => {
      delete document.documentElement.dataset.finpilotTheme;
      delete document.body.dataset.finpilotTheme;
    };
  }, [theme]);

  // If a previously selected currency is unavailable in the current rate table, safely return to INR.
  useEffect(() => {
    if (!ratesLoading && !exchangeRates[currencyCode]) {
      setCurrencyCode("INR");
      setDraftCurrencyCode("INR");
    }
  }, [ratesLoading, exchangeRates, currencyCode]);

  // Every financial record stores its own currencyCode. Legacy records without a currencyCode are treated as INR.
  const displayCurrencyCode = exchangeRates[currencyCode] ? currencyCode : "INR";
  const displayCurrencyRate = Number(exchangeRates[displayCurrencyCode]) || 1;
  const displayCurrencySymbol = currencySymbol(displayCurrencyCode);
  const displayMoney = (amountInInr) => money(amountInInr, displayCurrencyCode, displayCurrencyRate);
  const getCurrencyRate = (code) => {
    if (!code || code === "INR") return 1;
    const rate = Number(exchangeRates[code]);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  };
  const convertCurrencyAmount = (amount, fromCode, toCode) => {
    const numericAmount = Number(amount) || 0;
    const sourceCode = fromCode || "INR";
    const targetCode = toCode || "INR";
    if (sourceCode === targetCode) return numericAmount;
    const sourceRate = getCurrencyRate(sourceCode);
    const targetRate = getCurrencyRate(targetCode);
    // Keep the original numeric value rather than producing NaN if a provider
    // temporarily stops listing a previously used currency.
    if (!sourceRate || !targetRate) return numericAmount;
    return (numericAmount / sourceRate) * targetRate;
  };
  const inrToDisplayAmount = (amountInInr) => convertCurrencyAmount(amountInInr, "INR", displayCurrencyCode);
  const transactionAmountInInr = (transaction) => convertCurrencyAmount(
    transaction?.amount,
    transaction?.currencyCode || "INR",
    "INR"
  );
  const transactionMoney = (transaction) => displayMoney(transactionAmountInInr(transaction));
  const recordAmountInInr = (amount, recordCurrencyCode = "INR") =>
    convertCurrencyAmount(amount, recordCurrencyCode || "INR", "INR");
  const recordMoney = (amount, recordCurrencyCode = "INR") =>
    money(convertCurrencyAmount(amount, recordCurrencyCode || "INR", displayCurrencyCode), displayCurrencyCode, 1);
  const goalTargetAmountInInr = (goal) => recordAmountInInr(goal?.targetAmount, goal?.currencyCode || "INR");
  const goalSavedAmountInInr = (goal) => recordAmountInInr(goal?.savedAmount, goal?.savedAmountCurrencyCode || "INR");
  const currencyOptions = useMemo(() => {
    const codes = Object.keys(exchangeRates);
    codes.sort((a, b) => {
      if (a === "INR") return -1;
      if (b === "INR") return 1;
      return currencyName(a).localeCompare(currencyName(b));
    });
    return codes;
  }, [exchangeRates]);

  // Firebase Authentication listener. Keep this separate from the data listeners.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const verifiedUser = user?.emailVerified ? user : null;
      setCurrentUser(verifiedUser);
      // Always land on Dashboard after login (and reset the view after logout).
      setActivePage("Dashboard");
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Support requests are private to the signed-in user and update in real time.
  useEffect(() => {
    if (!currentUser) {
      setSupportRequests([]);
      setSupportRequestsLoading(false);
      setSupportRequestsError("");
      return undefined;
    }
    setSupportRequestsLoading(true);
    setSupportRequestsError("");
    const requestsRef = collection(db, "users", currentUser.uid, "supportRequests");
    return onSnapshot(requestsRef, (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setSupportRequests(rows);
      setSupportRequestsLoading(false);
      setSupportRequestsError("");
    }, (error) => {
      console.error("Support requests listener error:", error);
      setSupportRequestsLoading(false);
      setSupportRequestsError("Your request history could not be loaded. Check your connection and Firestore rules.");
    });
  }, [currentUser]);

  // Only the configured administrator can read the support collection group.
  const isSupportAdmin = currentUser?.uid === SUPPORT_ADMIN_UID;
  useEffect(() => {
    if (!currentUser || currentUser.uid !== SUPPORT_ADMIN_UID || activePage !== "Admin Support") {
      setAdminSupportRequests([]);
      setAdminSupportLoading(false);
      setAdminSupportError("");
      return undefined;
    }
    setAdminSupportLoading(true);
    setAdminSupportError("");
    const allRequestsQuery = query(collectionGroup(db, "supportRequests"));
    return onSnapshot(allRequestsQuery, (snapshot) => {
      const rows = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        ref: item.ref,
        userId: item.ref.parent.parent?.id || item.data().userId || "",
      }));
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setAdminSupportRequests(rows);
      setAdminSupportLoading(false);
      setAdminSupportError("");
    }, (error) => {
      console.error("Admin support listener error:", error);
      setAdminSupportLoading(false);
      setAdminSupportError("Support inbox could not be loaded. Check that the updated Firestore rules have been published and that you are signed in with the administrator account.");
    });
  }, [currentUser, activePage]);

  // User transactions are read from Firestore in real time.
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      return undefined;
    }
    const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
    return onSnapshot(transactionsRef, (snapshot) => {
      setTransactions(snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        note: item.data().note || "",
        currencyCode: item.data().currencyCode || "INR",
      })));
    }, (error) => {
      console.error("Transaction listener error:", error);
      alert("Unable to load transactions. Please check your connection and Firestore rules.");
    });
  }, [currentUser]);

  // Accounts and wallets are private to each user. Legacy transaction account labels
  // are mapped to zero-opening-balance records by the following migration effect.
  useEffect(() => {
    if (!currentUser) {
      setAccounts([]);
      setAccountsLoading(false);
      return undefined;
    }
    setAccountsLoading(true);
    const accountsRef = collection(db, "users", currentUser.uid, "accounts");
    return onSnapshot(accountsRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setAccounts(items);
      setAccountsLoading(false);
    }, (error) => {
      console.error("Accounts listener error:", error);
      setAccountsLoading(false);
    });
  }, [currentUser]);

  // Local bank-sync demonstration connections. These are mock providers only;
  // they never contact a real bank or request banking credentials.
  useEffect(() => {
    if (!currentUser) {
      setBankSyncDemoConnections([]);
      return undefined;
    }
    const connectionsRef = collection(db, "users", currentUser.uid, "bankSyncDemoConnections");
    return onSnapshot(connectionsRef, (snapshot) => {
      setBankSyncDemoConnections(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
    }, (error) => {
      console.error("Bank sync demo listener error:", error);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) { setTransfers([]); return undefined; }
    const transfersRef = collection(db, "users", currentUser.uid, "transfers");
    return onSnapshot(transfersRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      setTransfers(items);
    }, (error) => console.error("Transfers listener error:", error));
  }, [currentUser]);

  // Keep historical transactions usable with the new account ledger. This creates
  // zero-opening-balance account records for any legacy account label not yet present.
  const legacyAccountAttempts = useRef(new Set());
  useEffect(() => {
    if (!currentUser || !transactions.length) return;
    const knownNames = new Set(accounts.map((item) => String(item.name || "").trim().toLowerCase()));
    const missingNames = [...new Set(transactions.filter((item) => !item.accountId).map((item) => String(item.account || "").trim()).filter(Boolean))]
      .filter((name) => !knownNames.has(name.toLowerCase()) && !legacyAccountAttempts.current.has(`${currentUser.uid}:${name.toLowerCase()}`));
    if (!missingNames.length) return;
    const accountsRef = collection(db, "users", currentUser.uid, "accounts");
    missingNames.forEach((name) => {
      legacyAccountAttempts.current.add(`${currentUser.uid}:${name.toLowerCase()}`);
      const id = `legacy_${safeDocumentId(name).toLowerCase()}`;
      const matchingTransaction = transactions.find((item) => String(item.account || "").trim() === name);
      setDoc(doc(accountsRef, id), {
        name, type: "other", currencyCode: matchingTransaction?.currencyCode || "INR",
        openingBalance: 0, isLegacy: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true }).catch((error) => console.error(`Could not create account for legacy label ${name}:`, error));
    });
  }, [currentUser, accounts, transactions]);

  // Custom categories are saved separately for each signed-in user.
  useEffect(() => {
    if (!currentUser) {
      setCustomCategories([]);
      return undefined;
    }
    const categoriesRef = collection(db, "users", currentUser.uid, "categories");
    return onSnapshot(categoriesRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id, custom: true }));
      items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setCustomCategories(items);
    }, (error) => {
      console.error("Category listener error:", error);
    });
  }, [currentUser]);

  // Category budgets are monthly INR limits stored separately for each expense category.
  useEffect(() => {
    if (!currentUser) {
      setCategoryBudgets([]);
      setCategoryBudgetDrafts({});
      return undefined;
    }
    const budgetsRef = collection(db, "users", currentUser.uid, "categoryBudgets");
    return onSnapshot(budgetsRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      setCategoryBudgets(items);
    }, (error) => console.error("Category budgets listener error:", error));
  }, [currentUser]);

  // Convert each saved category limit from its own recorded currency into the current display currency.
  useEffect(() => {
    setCategoryBudgetDrafts(Object.fromEntries(categoryBudgets.map((item) => [
      item.categoryName,
      convertCurrencyAmount(item.monthlyLimit, item.currencyCode || "INR", displayCurrencyCode).toFixed(2),
    ])));
  }, [categoryBudgets, currencyCode, exchangeRates]);

  // Savings goals are private to the signed-in user.
  useEffect(() => {
    if (!currentUser) {
      setSavingsGoals([]);
      return undefined;
    }
    const goalsRef = collection(db, "users", currentUser.uid, "savingsGoals");
    return onSnapshot(goalsRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(a.deadline || "9999-12-31").localeCompare(String(b.deadline || "9999-12-31")));
      setSavingsGoals(items);
    }, (error) => console.error("Savings goals listener error:", error));
  }, [currentUser]);

  // Recurring payment schedules are private to the signed-in user.
  useEffect(() => {
    if (!currentUser) {
      setRecurringTransactions([]);
      return undefined;
    }
    const recurringRef = collection(db, "users", currentUser.uid, "recurringTransactions");
    return onSnapshot(recurringRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(a.nextDueDate || "").localeCompare(String(b.nextDueDate || "")));
      setRecurringTransactions(items);
    }, (error) => console.error("Recurring transactions listener error:", error));
  }, [currentUser]);

  // Bill reminders are in-app reminders (overdue / due today / due soon), not push notifications.
  useEffect(() => {
    if (!currentUser) {
      setBillReminders([]);
      return undefined;
    }
    const remindersRef = collection(db, "users", currentUser.uid, "billReminders");
    return onSnapshot(remindersRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
      setBillReminders(items);
    }, (error) => console.error("Bill reminders listener error:", error));
  }, [currentUser]);

  // Private split-expense records.
  useEffect(() => {
    if (!currentUser) { setSplitExpenses([]); return undefined; }
    const splitRef = collection(db, "users", currentUser.uid, "splitExpenses");
    return onSnapshot(splitRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      setSplitExpenses(items);
    }, (error) => console.error("Split expenses listener error:", error));
  }, [currentUser]);

  // Collaborative budgets live at the root so invited users can read the same budget.
  // Firestore rules restrict each document to its owner and explicitly invited email addresses.
  useEffect(() => {
    if (!currentUser) { setOwnedSharedBudgets([]); setInvitedSharedBudgets([]); return undefined; }
    const ownedQuery = query(collection(db, "sharedBudgets"), where("ownerUid", "==", currentUser.uid));
    const unsubOwned = onSnapshot(ownedQuery, (snapshot) => {
      setOwnedSharedBudgets(snapshot.docs.map((item) => ({ ...item.data(), id: item.id, isOwner: true })));
    }, (error) => console.error("Owned shared budgets listener error:", error));
    let unsubInvited = () => {};
    if (currentUser.email) {
      const invitedQuery = query(collection(db, "sharedBudgets"), where("memberEmails", "array-contains", currentUser.email));
      unsubInvited = onSnapshot(invitedQuery, (snapshot) => {
        setInvitedSharedBudgets(snapshot.docs.map((item) => ({ ...item.data(), id: item.id, isOwner: false })));
      }, (error) => console.error("Invited shared budgets listener error:", error));
    } else setInvitedSharedBudgets([]);
    return () => { unsubOwned(); unsubInvited(); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedSharedBudgetId) { setSharedBudgetEntries([]); return undefined; }
    const entriesRef = collection(db, "sharedBudgets", selectedSharedBudgetId, "entries");
    return onSnapshot(entriesRef, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      setSharedBudgetEntries(items);
    }, (error) => { console.error("Shared budget entries listener error:", error); setSharedBudgetEntries([]); });
  }, [currentUser, selectedSharedBudgetId]);

  // Online/offline indicator. Firestore's persistent local cache queues writes while offline.
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  // Cache the application shell for repeat visits. Firestore records use IndexedDB persistence.
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => console.warn("FinPilot offline shell registration failed:", error));
    }
  }, []);

  // Browser alerts are displayed while FinPilot is open. Background push needs a server/FCM setup.
  useEffect(() => {
    if (!currentUser || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const today = getDate();
    billReminders.filter((item) => item.paid !== true && item.dueDate && item.dueDate <= today).forEach((item) => {
      const marker = `finpilot_due_notice_${currentUser.uid}_${item.id}_${today}`;
      if (localStorage.getItem(marker)) return;
      try {
        new Notification(item.dueDate < today ? `Overdue: ${item.title}` : `Due today: ${item.title}`, {
          body: `${Number(item.amount || 0).toFixed(2)} ${item.currencyCode || "INR"} · ${item.dueDate}`,
          tag: marker,
        });
        localStorage.setItem(marker, "1");
      } catch (error) { console.warn("Browser notification could not be shown:", error); }
    });
  }, [currentUser, billReminders, notificationPermission]);

  // Automatically record recurring occurrences that are due. Each occurrence uses
  // a deterministic transaction ID and a Firestore transaction, preventing duplicates
  // when the app is opened in multiple tabs or devices.
  useEffect(() => {
    if (!currentUser || !recurringTransactions.length) return;
    const today = getDate();
    recurringTransactions.filter((item) => item.active !== false && item.nextDueDate && item.nextDueDate <= today)
      .forEach((item) => {
        const recurringRef = doc(db, "users", currentUser.uid, "recurringTransactions", item.id);
        const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
        runTransaction(db, async (firestoreTransaction) => {
          const recurringSnapshot = await firestoreTransaction.get(recurringRef);
          if (!recurringSnapshot.exists()) return;
          const data = recurringSnapshot.data();
          if (data.active === false || !data.nextDueDate || data.nextDueDate > today) return;
          let dueDate = data.nextDueDate;
          let createdCount = 0;
          const anchorDay = Number(data.anchorDay) || Number(String(dueDate).slice(8, 10));
          while (dueDate && dueDate <= today && createdCount < 450) {
            const transactionId = `recurring_${item.id}_${dueDate}`;
            const transactionRef = doc(transactionsRef, transactionId);
            firestoreTransaction.set(transactionRef, {
              title: data.title || "Recurring transaction",
              type: data.type === "income" ? "income" : "expense",
              category: data.category || "Other",
              amount: Number(data.amount) || 0,
              currencyCode: data.currencyCode || "INR",
              date: dueDate,
              account: data.account || "Bank Account",
              accountId: accounts.find((account) => account.name === (data.account || "Bank Account"))?.id || "",
              accountAmount: Number(convertCurrencyAmount(Number(data.amount) || 0, data.currencyCode || "INR", accounts.find((account) => account.name === (data.account || "Bank Account"))?.currencyCode || "INR").toFixed(2)),
              accountCurrencyCode: accounts.find((account) => account.name === (data.account || "Bank Account"))?.currencyCode || "INR",
              note: data.note ? `${data.note} (recurring)` : "Automatically recorded from a recurring schedule.",
              recurringId: item.id,
              isRecurring: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            dueDate = advanceRecurringDate(dueDate, data.frequency, anchorDay);
            createdCount += 1;
          }
          if (createdCount > 0) {
            firestoreTransaction.update(recurringRef, {
              nextDueDate: dueDate,
              lastProcessedDate: today,
              updatedAt: serverTimestamp(),
            });
          }
        }).catch((error) => console.error(`Unable to process recurring schedule ${item.id}:`, error));
      });
  }, [currentUser, recurringTransactions, accounts, exchangeRates]);

  // Budget and display preferences are scoped to this user, not shared in browser storage.
  useEffect(() => {
    if (!currentUser) {
      setSettingsReady(false);
      return undefined;
    }
    setSettingsReady(false);
    const preferencesRef = doc(db, "users", currentUser.uid, "settings", "preferences");
    return onSnapshot(preferencesRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const legacyBudgetSetting = readStorage("finpilot_budget", 16000);
      const legacyBudget = Number(
        legacyBudgetSetting && typeof legacyBudgetSetting === "object"
          ? legacyBudgetSetting.amount
          : legacyBudgetSetting
      );
      const legacyBudgetCurrencyCode = legacyBudgetSetting && typeof legacyBudgetSetting === "object"
        && typeof legacyBudgetSetting.currencyCode === "string" && /^[A-Z]{3}$/.test(legacyBudgetSetting.currencyCode)
        ? legacyBudgetSetting.currencyCode : "INR";
      setBudget(Number.isFinite(data.monthlyBudget) && data.monthlyBudget > 0
        ? data.monthlyBudget
        : (legacyBudget > 0 ? legacyBudget : 16000));
      setBudgetCurrencyCode(typeof data.monthlyBudgetCurrencyCode === "string" && /^[A-Z]{3}$/.test(data.monthlyBudgetCurrencyCode)
        ? data.monthlyBudgetCurrencyCode
        : (!Number.isFinite(data.monthlyBudget) && legacyBudget > 0 ? legacyBudgetCurrencyCode : "INR"));
      const savedTheme = data.theme === "dark" ? "dark" : "light";
      const savedDateFormat = ["dd MMM yyyy", "dd/MM/yyyy", "yyyy-MM-dd"].includes(data.dateFormat)
        ? data.dateFormat : "dd MMM yyyy";
      const savedCurrencyCode = typeof data.currencyCode === "string" && /^[A-Z]{3}$/.test(data.currencyCode)
        ? data.currencyCode : "INR";
      setTheme(savedTheme);
      setSavedTheme(savedTheme);
      setDateFormat(savedDateFormat);
      setCurrencyCode(savedCurrencyCode);
      setDraftTheme(savedTheme);
      setDraftDateFormat(savedDateFormat);
      setDraftCurrencyCode(savedCurrencyCode);
      const savedCategoryOrder = data.categoryOrder && typeof data.categoryOrder === "object"
        ? data.categoryOrder : {};
      setCategoryOrder({
        expense: Array.isArray(savedCategoryOrder.expense)
          ? savedCategoryOrder.expense.filter((key) => typeof key === "string") : [],
        income: Array.isArray(savedCategoryOrder.income)
          ? savedCategoryOrder.income.filter((key) => typeof key === "string") : [],
      });
      setSettingsReady(true);
    }, (error) => {
      console.error("Settings listener error:", error);
      setSettingsReady(true);
    });
  }, [currentUser]);

  // Load the current user's optional profile details from their own Firestore document.
  useEffect(() => {
    if (!currentUser) {
      setProfileName("");
      setProfilePhone("");
      setProfileCountry("India");
      setProfileOccupation("");
      setProfilePhotoData("");
      return undefined;
    }

    setProfileName(currentUser.displayName || "");
    setProfilePhotoData("");
    const profileRef = doc(db, "users", currentUser.uid);
    return onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      setProfileName(data.displayName || currentUser.displayName || "");
      setProfilePhone(data.phoneNumber || "");
      setProfileCountry(data.country || "India");
      setProfileOccupation(data.occupation || "");
      setProfilePhotoData(typeof data.photoDataUrl === "string" ? data.photoDataUrl : "");
    }, (error) => {
      console.error("Profile listener error:", error);
      setProfileName(currentUser.displayName || "");
    });
  }, [currentUser]);

  const sharedBudgets = useMemo(() => [...ownedSharedBudgets, ...invitedSharedBudgets.filter((item) => !ownedSharedBudgets.some((owned) => owned.id === item.id))], [ownedSharedBudgets, invitedSharedBudgets]);
  const selectedSharedBudget = sharedBudgets.find((item) => item.id === selectedSharedBudgetId) || null;
  const allCategories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...customCategories],
    [customCategories]
  );
  const expenseCategories = useMemo(
    () => sortCategoriesByPreference(
      allCategories.filter((item) => item.type === "expense" || item.type === "both"),
      categoryOrder.expense
    ),
    [allCategories, categoryOrder.expense]
  );
  const incomeCategories = useMemo(
    () => sortCategoriesByPreference(
      allCategories.filter((item) => item.type === "income" || item.type === "both"),
      categoryOrder.income
    ),
    [allCategories, categoryOrder.income]
  );
  const categoryNames = useMemo(
    () => [...new Set([...expenseCategories, ...incomeCategories].map((item) => item.name))],
    [expenseCategories, incomeCategories]
  );
  const categoryOptionsForForm = useMemo(() => {
    const options = form.type === "income" ? incomeCategories : expenseCategories;
    const result = [...options];
    if (form.category && !result.some((item) => item.name === form.category)) {
      result.push({ name: form.category, type: form.type, icon: "○", legacy: true });
    }
    return result;
  }, [expenseCategories, incomeCategories, form.type, form.category]);

  const getCategoryIcon = (name) => allCategories.find((item) => item.name === name)?.icon || "○";

  const getAccountBalance = (account) => {
    if (!account) return 0;
    const accountCurrency = account.currencyCode || "INR";
    let current = Number(account.openingBalance) || 0;
    transactions.forEach((item) => {
      const matchesAccount = item.accountId
        ? item.accountId === account.id
        : String(item.account || "").trim().toLowerCase() === String(account.name || "").trim().toLowerCase();
      if (!matchesAccount || (account.openingBalanceDate && item.date && item.date < account.openingBalanceDate)) return;
      const amount = Number.isFinite(Number(item.accountAmount)) && (item.accountCurrencyCode || accountCurrency) === accountCurrency
        ? Number(item.accountAmount)
        : convertCurrencyAmount(item.amount, item.currencyCode || "INR", accountCurrency);
      current += item.type === "income" ? amount : -amount;
    });
    transfers.forEach((item) => {
      if (account.openingBalanceDate && item.date && item.date < account.openingBalanceDate) return;
      if (item.fromAccountId === account.id) {
        current -= convertCurrencyAmount(item.fromAmount, item.fromCurrencyCode || accountCurrency, accountCurrency);
      }
      if (item.toAccountId === account.id) {
        current += convertCurrencyAmount(item.toAmount, item.toCurrencyCode || accountCurrency, accountCurrency);
      }
    });
    return Number(current.toFixed(2));
  };
  const getAccountBalanceAtDate = (account, endDate) => {
    if (!account || !endDate) return 0;
    const accountCurrency = account.currencyCode || "INR";
    let current = Number(account.openingBalance) || 0;
    transactions.forEach((item) => {
      const matchesAccount = item.accountId
        ? item.accountId === account.id
        : String(item.account || "").trim().toLowerCase() === String(account.name || "").trim().toLowerCase();
      if (!matchesAccount || !item.date || item.date > endDate
        || (account.openingBalanceDate && item.date < account.openingBalanceDate)) return;
      const amount = Number.isFinite(Number(item.accountAmount)) && (item.accountCurrencyCode || accountCurrency) === accountCurrency
        ? Number(item.accountAmount)
        : convertCurrencyAmount(item.amount, item.currencyCode || "INR", accountCurrency);
      current += item.type === "income" ? amount : -amount;
    });
    transfers.forEach((item) => {
      if (!item.date || item.date > endDate || (account.openingBalanceDate && item.date < account.openingBalanceDate)) return;
      if (item.fromAccountId === account.id) current -= Number(item.fromAmount) || 0;
      if (item.toAccountId === account.id) current += Number(item.toAmount) || 0;
    });
    return Number(current.toFixed(2));
  };
  const totalAccountBalanceInInr = accounts.reduce((sum, account) =>
    sum + convertCurrencyAmount(getAccountBalance(account), account.currencyCode || "INR", "INR"), 0);
  const accountNameById = useMemo(() => Object.fromEntries(accounts.map((item) => [item.id, item.name])), [accounts]);

  const monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();
  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const monthTransactions = useMemo(
    () => transactions.filter((item) => String(item.date || "").startsWith(monthKey)),
    [transactions, monthKey]
  );
  const income = monthTransactions.filter((item) => item.type === "income")
    .reduce((sum, item) => sum + transactionAmountInInr(item), 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + transactionAmountInInr(item), 0);
  // Total available balance is calculated from actual account opening balances,
  // ledger transactions and account transfers. No synthetic starting balance is added.
  const balance = totalAccountBalanceInInr;
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const budgetInInr = recordAmountInInr(budget, budgetCurrencyCode);
  const budgetUsed = budgetInInr > 0 ? (expenses / budgetInInr) * 100 : 0;
  const categoryBudgetByName = useMemo(
    () => Object.fromEntries(categoryBudgets.map((item) => [
      item.categoryName,
      convertCurrencyAmount(item.monthlyLimit, item.currencyCode || "INR", "INR"),
    ])),
    [categoryBudgets, exchangeRates]
  );
  const categorySpend = (categoryName) => monthTransactions
    .filter((item) => item.type === "expense" && item.category === categoryName)
    .reduce((sum, item) => sum + transactionAmountInInr(item), 0);

  const previousMonthKey = shiftMonthKey(monthKey, -1);
  const previousMonthTransactions = transactions.filter((item) => String(item.date || "").startsWith(previousMonthKey));
  const previousMonthSummary = summarizeTransactions(previousMonthTransactions, transactionAmountInInr);
  const previousMonthDays = new Date(Number(previousMonthKey.slice(0, 4)), Number(previousMonthKey.slice(5, 7)), 0).getDate();
  const comparableDay = Math.min(new Date().getDate(), previousMonthDays);
  const previousComparableExpenses = previousMonthTransactions
    .filter((item) => Number(String(item.date || "").slice(8, 10)) <= comparableDay && item.type === "expense")
    .reduce((sum, item) => sum + transactionAmountInInr(item), 0);
  const spendingChangePercent = previousComparableExpenses > 0
    ? ((expenses - previousComparableExpenses) / previousComparableExpenses) * 100
    : null;

  const comparisonPreviousMonth = shiftMonthKey(selectedComparisonMonth, -1);
  const comparisonCurrentSummary = summarizeTransactions(
    transactions.filter((item) => String(item.date || "").startsWith(selectedComparisonMonth)),
    transactionAmountInInr
  );
  const comparisonPreviousSummary = summarizeTransactions(
    transactions.filter((item) => String(item.date || "").startsWith(comparisonPreviousMonth)),
    transactionAmountInInr
  );
  const comparisonMonthOptions = Array.from({ length: 12 }, (_, index) => shiftMonthKey(getMonthKey(new Date()), -index));

  const weeklyOverview = Array.from({ length: 5 }, (_, index) => {
    const weekNumber = index + 1;
    const weeklyTransactions = monthTransactions.filter((item) =>
      Math.ceil(Number(String(item.date).slice(8, 10)) / 7) === weekNumber
    );
    return {
      label: `Week ${weekNumber}`,
      income: weeklyTransactions.filter((item) => item.type === "income")
        .reduce((sum, item) => sum + transactionAmountInInr(item), 0),
      expense: weeklyTransactions.filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + transactionAmountInInr(item), 0),
    };
  });
  const maxWeeklyAmount = Math.max(1, ...weeklyOverview.flatMap((week) => [week.income, week.expense]));

  const expenseCategoryNames = [...new Set(allCategories
    .filter((item) => item.type === "expense" || item.type === "both")
    .map((item) => item.name))];
  const categoryTotals = expenseCategoryNames.map((name) => ({
    name,
    amount: monthTransactions.filter((item) => item.type === "expense" && item.category === name)
      .reduce((sum, item) => sum + transactionAmountInInr(item), 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  const topExpenses = monthTransactions.filter((item) => item.type === "expense")
    .slice().sort((a, b) => transactionAmountInInr(b) - transactionAmountInInr(a)).slice(0, 5);

  const completedMonthKeys = [1, 2, 3].map((offset) => shiftMonthKey(monthKey, -offset));
  const completedMonthExpenses = completedMonthKeys.map((key) => transactions
    .filter((item) => String(item.date || "").startsWith(key) && item.type === "expense")
    .reduce((sum, item) => sum + transactionAmountInInr(item), 0));
  const monthsWithExpenseHistory = completedMonthExpenses.filter((value) => value > 0);
  const historicalExpenseAverage = monthsWithExpenseHistory.length
    ? monthsWithExpenseHistory.reduce((sum, value) => sum + value, 0) / monthsWithExpenseHistory.length : 0;
  const todayForForecast = new Date();
  const daysElapsed = Math.max(1, todayForForecast.getDate());
  const daysInCurrentMonth = new Date(todayForForecast.getFullYear(), todayForForecast.getMonth() + 1, 0).getDate();
  const currentMonthPaceForecast = expenses / daysElapsed * daysInCurrentMonth;
  const predictedMonthEndExpenses = historicalExpenseAverage > 0
    ? historicalExpenseAverage * 0.6 + currentMonthPaceForecast * 0.4
    : currentMonthPaceForecast;
  const forecastVariance = historicalExpenseAverage > 0 ? predictedMonthEndExpenses - historicalExpenseAverage : 0;

  const savingsHealthScore = clampNumber((savingsRate + 5) * 1.8, 0, 100);
  const budgetHealthScore = budgetInInr > 0
    ? clampNumber(100 - Math.max(0, budgetUsed - 75) * 1.5, 10, 100) : 65;
  const positiveMonths = completedMonthExpenses.filter((value) => value > 0);
  const meanHistoricalExpenses = positiveMonths.length
    ? positiveMonths.reduce((sum, value) => sum + value, 0) / positiveMonths.length : 0;
  const historicalVariance = meanHistoricalExpenses > 0 && positiveMonths.length > 1
    ? positiveMonths.reduce((sum, value) => sum + ((value - meanHistoricalExpenses) ** 2), 0) / positiveMonths.length : 0;
  const expenseStabilityScore = positiveMonths.length > 1
    ? clampNumber(100 - (Math.sqrt(historicalVariance) / meanHistoricalExpenses) * 65, 25, 100) : 65;
  const recordKeepingScore = clampNumber(monthTransactions.length * 7, 25, 100);
  const financialHealthScore = Math.round(
    savingsHealthScore * 0.35 + budgetHealthScore * 0.30 + expenseStabilityScore * 0.20 + recordKeepingScore * 0.15
  );
  const financialHealthLabel = transactions.length < 5 ? "Building your baseline" : financialHealthScore >= 80 ? "Strong" : financialHealthScore >= 60 ? "Building" : financialHealthScore >= 40 ? "Needs attention" : "At risk";

  const spendingInsights = [];
  if (!monthTransactions.length) {
    spendingInsights.push({ icon: "◌", title: "Start tracking your month", text: "Add income and expense transactions to generate useful spending insights." });
  } else {
    if (categoryTotals.length) {
      spendingInsights.push({ icon: "◇", title: "Top spending category", text: `${categoryTotals[0].name} is your highest expense category this month at ${displayMoney(categoryTotals[0].amount)}.` });
    }
    if (spendingChangePercent !== null) {
      const trendText = spendingChangePercent > 1
        ? `Your expenses are ${spendingChangePercent.toFixed(1)}% higher than the same number of days last month.`
        : spendingChangePercent < -1
          ? `Your expenses are ${Math.abs(spendingChangePercent).toFixed(1)}% lower than the same number of days last month.`
          : "Your expenses are broadly similar to the same number of days last month.";
      spendingInsights.push({ icon: spendingChangePercent > 1 ? "↗" : spendingChangePercent < -1 ? "↘" : "→", title: "Month-to-date spending trend", text: trendText });
    } else {
      spendingInsights.push({ icon: "▤", title: "Build a spending baseline", text: "There is not enough previous-month data yet to compare spending trends." });
    }
    const overBudgetList = categoryBudgets.filter((item) => categorySpend(item.categoryName) > (categoryBudgetByName[item.categoryName] || 0));
    if (overBudgetList.length) {
      spendingInsights.push({ icon: "!", title: "Category budget exceeded", text: `${overBudgetList.map((item) => item.categoryName).join(", ")} ${overBudgetList.length === 1 ? "has" : "have"} exceeded ${overBudgetList.length === 1 ? "its" : "their"} monthly limit.` });
    } else if (categoryBudgets.length) {
      spendingInsights.push({ icon: "✓", title: "Category budgets on track", text: "None of your configured category budgets has been exceeded this month." });
    }
    spendingInsights.push({ icon: "◈", title: "Current savings rate", text: income > 0 ? `You have retained ${savingsRate.toFixed(1)}% of this month's recorded income.` : "Record income transactions to calculate your savings rate." });
    if (topExpenses.length) {
      spendingInsights.push({ icon: "₹", title: "Largest individual expense", text: `${topExpenses[0].title} is your largest expense this month at ${transactionMoney(topExpenses[0])}.` });
    }
  }

  const suggestedTransactionCategory = inferTransactionCategory(form.title, form.type, form.type === "income" ? incomeCategories : expenseCategories);

  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const queryText = search.trim().toLowerCase();
    const matchesSearch = !queryText || [item.title, item.category, item.account, item.note, item.currencyCode]
      .some((value) => String(value || "").toLowerCase().includes(queryText));
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStart = !filterStartDate || item.date >= filterStartDate;
    const matchesEnd = !filterEndDate || item.date <= filterEndDate;
    const matchesAccount = filterAccount === "all" || (item.accountId ? item.accountId === filterAccount : String(item.account || "") === accountNameById[filterAccount]);
    const matchesCurrency = filterCurrency === "all" || (item.currencyCode || "INR") === filterCurrency;
    const visibleAmount = convertCurrencyAmount(item.amount, item.currencyCode || "INR", displayCurrencyCode);
    const matchesMin = filterMinAmount === "" || visibleAmount >= Number(filterMinAmount);
    const matchesMax = filterMaxAmount === "" || visibleAmount <= Number(filterMaxAmount);
    return matchesSearch && matchesType && matchesCategory && matchesStart && matchesEnd && matchesAccount && matchesCurrency && matchesMin && matchesMax;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date))),
  [transactions, search, filterType, filterCategory, filterStartDate, filterEndDate, filterAccount, filterCurrency, filterMinAmount, filterMaxAmount, accounts, displayCurrencyCode, exchangeRates]);

  const preferencesRef = currentUser
    ? doc(db, "users", currentUser.uid, "settings", "preferences")
    : null;
  const savePreferences = async (changes) => {
    if (!preferencesRef) throw new Error("No signed-in user.");
    await setDoc(preferencesRef, { ...changes, updatedAt: serverTimestamp() }, { merge: true });
  };

  // Settings are drafts until Save Settings succeeds. Leaving the Settings page
  // without saving discards every uncommitted change immediately.
  const navigateToPage = (page) => {
    if (activePage === "Settings" && page !== "Settings") {
      // Discard uncommitted preferences. Theme is previewed live, so restore its saved value.
      setTheme(savedTheme);
      setDraftTheme(savedTheme);
      setDraftDateFormat(dateFormat);
      setDraftCurrencyCode(currencyCode);
    }
    const targetGroup = NAV_GROUPS.find((group) => group.items.some((item) => item.name === page));
    if (targetGroup) {
      setExpandedNavGroups((previous) => ({ ...previous, [targetGroup.name]: true }));
    }
    setActivePage(page);
  };

  const submitSupportRequest = async (event) => {
    event.preventDefault();
    if (!currentUser || supportSubmitting) return;
    const subject = supportForm.subject.trim();
    const message = supportForm.message.trim();
    if (!subject || !message) {
      setSupportNotice({ type: "error", message: "Please enter both a subject and a message." });
      return;
    }
    if (subject.length > 100 || message.length > 3000) {
      setSupportNotice({ type: "error", message: "Please keep the subject under 100 characters and the message under 3,000 characters." });
      return;
    }

    setSupportSubmitting(true);
    setSupportNotice(null);
    try {
      await addDoc(collection(db, "users", currentUser.uid, "supportRequests"), {
        type: supportMode === "contact" ? "contact" : "issue",
        category: supportMode === "contact" ? "General enquiry" : supportForm.category,
        subject,
        message,
        contactName: profileName || currentUser.displayName || "",
        contactEmail: currentUser.email || "",
        userId: currentUser.uid,
        status: "Open",
        adminReply: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSupportForm({ category: "Bug or error", subject: "", message: "" });
      setSupportMode("requests");
      setSupportNotice({ type: "success", message: "Your message has been saved to your private FinPilot support history." });
    } catch (error) {
      console.error("Support request submission error:", error);
      setSupportNotice({ type: "error", message: "We couldn't save your message. Check your internet connection and Firebase security rules, then try again." });
    } finally {
      setSupportSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    // The default is 100 units of the currently selected display currency.
    setForm({ title: "", type: "expense", category: "Food", amount: "100", date: getDate(), account: "UPI", note: "" });
    setModalOpen(true);
  };

  // Monetary fields share a paise-enabled input with ±500 controls.
  const openEditModal = (transaction) => {
    setEditingId(transaction.id);
    // Convert this transaction's recorded currency into the currently selected currency.
    const amountInSelectedCurrency = convertCurrencyAmount(
      transaction.amount,
      transaction.currencyCode || "INR",
      displayCurrencyCode
    );
    setForm({
      title: transaction.title || "", type: transaction.type || "expense",
      category: transaction.category || "Other",
      amount: amountInSelectedCurrency.toFixed(2),
      date: transaction.date || getDate(), account: transaction.account || "UPI", note: transaction.note || "",
    });
    setModalOpen(true);
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    const amountText = form.amount.trim();
    const enteredDisplayAmount = Number(amountText);
    const hasValidAmountFormat = /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText);
    if (!form.title.trim() || !hasValidAmountFormat || !Number.isFinite(enteredDisplayAmount) || enteredDisplayAmount <= 0 || !form.date) {
      alert(`Please enter a description, a valid ${displayCurrencyCode} amount (up to two decimal places) and a date.`);
      return;
    }
    // Transactions may be dated in the past or today, but never in the future.
    if (form.date > getDate()) {
      alert("Transaction date cannot be later than today.");
      return;
    }
    const selectedPaymentAccount = accounts.find((item) => item.name === form.account);
    if (selectedPaymentAccount?.openingBalanceDate && form.date < selectedPaymentAccount.openingBalanceDate) {
      alert(`This account's opening balance is dated ${selectedPaymentAccount.openingBalanceDate}. Choose that date or a later date, or correct the account's opening balance date first.`);
      return;
    }
    if (!currentUser) return;
    if (!getCurrencyRate(displayCurrencyCode)) {
      alert("The selected currency rate is unavailable. Please choose INR or refresh the exchange rates before saving.");
      return;
    }
    setTransactionSaving(true);
    const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
    const payload = {
      title: form.title.trim(), type: form.type, category: form.category,
      // Keep the amount in the selected preferred currency; link it to a wallet ledger.
      amount: Number(enteredDisplayAmount.toFixed(2)), currencyCode: displayCurrencyCode,
      date: form.date, account: form.account,
      accountId: accounts.find((item) => item.name === form.account)?.id || "",
      accountAmount: Number(convertCurrencyAmount(enteredDisplayAmount, displayCurrencyCode, accounts.find((item) => item.name === form.account)?.currencyCode || "INR").toFixed(2)),
      accountCurrencyCode: accounts.find((item) => item.name === form.account)?.currencyCode || "INR",
      note: form.note.trim(),
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingId) {
        await updateDoc(doc(transactionsRef, String(editingId)), payload);
      } else {
        await addDoc(transactionsRef, { ...payload, createdAt: serverTimestamp() });
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Save transaction error:", error);
      alert("Unable to save the transaction. Please check your connection and Firestore rules.");
    } finally {
      setTransactionSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!currentUser || !window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "transactions", String(id)));
    } catch (error) {
      console.error("Delete transaction error:", error);
      alert("Unable to delete this transaction. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearch(""); setFilterType("all"); setFilterCategory("all");
    setFilterStartDate(""); setFilterEndDate(""); setFilterAccount("all");
    setFilterCurrency("all"); setFilterMinAmount(""); setFilterMaxAmount("");
  };

  const exportCSV = () => {
    if (!filteredTransactions.length) {
      alert("There are no transactions to export with the current filters.");
      return;
    }
    const rows = [
      ["Date", "Description", "Type", "Category", "Account", "Amount", "Currency", "Notes"],
      ...filteredTransactions.map((item) => [
        item.date, item.title, item.type, item.category, item.account,
        Number(item.amount || 0).toFixed(2), item.currencyCode || "INR", item.note || "",
      ]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finpilot-transactions-${getDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Export the currently filtered transactions as a print-ready report.
  // The browser's print dialog lets the user choose "Save as PDF" without
  // requiring an additional PDF-generation dependency.
  const exportPDF = () => {
    if (!filteredTransactions.length) {
      alert("There are no transactions to export with the current filters.");
      return;
    }

    const escapeHTML = (value) => String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const reportIncome = filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + transactionAmountInInr(item), 0);
    const reportExpenses = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + transactionAmountInInr(item), 0);
    const reportNet = reportIncome - reportExpenses;

    const activeFilters = [
      filterType !== "all" ? `Type: ${filterType}` : "Type: All",
      filterCategory !== "all" ? `Category: ${filterCategory}` : "Category: All",
      filterStartDate ? `From: ${formatDate(filterStartDate, dateFormat)}` : null,
      filterEndDate ? `To: ${formatDate(filterEndDate, dateFormat)}` : null,
      search.trim() ? `Search: ${search.trim()}` : null,
    ].filter(Boolean).join("  |  ");

    const tableRows = filteredTransactions.map((item, index) => `
      <tr>
        <td class="number">${index + 1}</td>
        <td>${escapeHTML(formatDate(item.date, dateFormat))}</td>
        <td class="description">${escapeHTML(item.title)}</td>
        <td>${escapeHTML(item.type)}</td>
        <td>${escapeHTML(item.category)}</td>
        <td>${escapeHTML(item.account)}</td>
        <td class="amount">${escapeHTML(transactionMoney(item))}</td>
        <td>${escapeHTML(`${Number(item.amount || 0).toFixed(2)} ${item.currencyCode || "INR"}`)}</td>
        <td class="notes">${escapeHTML(item.note || "—").replace(/\n/g, "<br>")}</td>
      </tr>
    `).join("");

    const reportHTML = `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>FinPilot Transaction Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; color: #20243A; font: 12px Arial, sans-serif; }
            .report-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 2px solid #7667E8; padding-bottom: 16px; margin-bottom: 18px; }
            h1 { margin: 0 0 5px; font-size: 25px; color: #5145B8; }
            .subtitle, .generated, .filters { color: #687086; }
            .generated { text-align: right; line-height: 1.6; }
            .filters { margin: 0 0 18px; padding: 10px 12px; background: #F6F5FF; border-radius: 6px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-card { border: 1px solid #E7E8F0; border-radius: 8px; padding: 12px; }
            .summary-card span { display: block; color: #687086; margin-bottom: 6px; }
            .summary-card strong { font-size: 17px; }
            h2 { margin: 0 0 10px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; table-layout: auto; }
            thead { display: table-header-group; }
            th { background: #F0EEFF; color: #5145B8; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
            th, td { padding: 8px 7px; border: 1px solid #E5E6ED; vertical-align: top; }
            tr { page-break-inside: avoid; }
            td { overflow-wrap: anywhere; }
            .number { width: 28px; text-align: center; color: #687086; }
            .description { font-weight: 700; min-width: 110px; }
            .amount { text-align: right; white-space: nowrap; font-weight: 700; }
            .notes { min-width: 120px; color: #687086; }
            .footer { margin-top: 18px; color: #8A8FA0; font-size: 10px; text-align: center; }
            @page { size: A4 landscape; margin: 12mm; }
            @media print { body { padding: 0; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <header class="report-header">
            <div><h1>FinPilot</h1><div class="subtitle">Transaction Report</div></div>
            <div class="generated">Generated: ${escapeHTML(new Date().toLocaleString("en-IN"))}<br>Records: ${filteredTransactions.length}<br>Display currency: ${escapeHTML(displayCurrencyCode)}</div>
          </header>
          <div class="filters"><strong>Applied filters:</strong> ${escapeHTML(activeFilters)}</div>
          <section class="summary">
            <div class="summary-card"><span>Income in this report</span><strong>${escapeHTML(displayMoney(reportIncome))}</strong></div>
            <div class="summary-card"><span>Expenses in this report</span><strong>${escapeHTML(displayMoney(reportExpenses))}</strong></div>
            <div class="summary-card"><span>Net amount</span><strong>${escapeHTML(displayMoney(reportNet))}</strong></div>
          </section>
          <h2>Transactions</h2>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th>Account</th><th>Display amount (${escapeHTML(displayCurrencyCode)})</th><th>Recorded amount</th><th>Notes</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">Each transaction is stored in the currency selected when it was entered. Report totals are converted to ${escapeHTML(displayCurrencyCode)} using daily reference rates based on INR. Legacy transactions without a currency code are treated as INR.<br>Rates by <a href="https://www.exchangerate-api.com">Exchange Rate API</a> · FinPilot · Your money, your control.</div>
          <script>window.addEventListener("load", function () { window.focus(); window.print(); }); window.addEventListener("afterprint", function () { window.close(); });</script>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      alert("Your browser blocked the report window. Please allow pop-ups for FinPilot and try again.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", type: "expense" });
    setCategoryModalOpen(true);
  };
  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, type: category.type });
    setCategoryModalOpen(true);
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const name = categoryForm.name.trim();
    if (!name) return;
    const duplicate = allCategories.some((item) =>
      item.name.toLowerCase() === name.toLowerCase()
      && item.type === categoryForm.type
      && item.name !== editingCategory?.name
    );
    if (duplicate) {
      alert("A category with this name already exists for that transaction type.");
      return;
    }
    setCategorySaving(true);
    const categoriesRef = collection(db, "users", currentUser.uid, "categories");
    try {
      if (editingCategory) {
        await updateDoc(doc(categoriesRef, editingCategory.id), { name, updatedAt: serverTimestamp() });
        const existingCategoryBudget = categoryBudgets.find((item) => item.categoryName === editingCategory.name);
        if (existingCategoryBudget && editingCategory.type !== "income") {
          const oldBudgetId = categoryBudgetDocId(editingCategory.name);
          const newBudgetId = categoryBudgetDocId(name);
          await setDoc(doc(db, "users", currentUser.uid, "categoryBudgets", newBudgetId), {
            categoryName: name,
            monthlyLimit: existingCategoryBudget.monthlyLimit,
            currencyCode: existingCategoryBudget.currencyCode || "INR",
            updatedAt: serverTimestamp(),
          }, { merge: true });
          if (oldBudgetId !== newBudgetId) {
            await deleteDoc(doc(db, "users", currentUser.uid, "categoryBudgets", oldBudgetId));
          }
        }
        // Keep historical transactions consistent when a custom category is renamed.
        const transactionSnapshot = await getDocs(collection(db, "users", currentUser.uid, "transactions"));
        const matches = transactionSnapshot.docs.filter((item) =>
          item.data().category === editingCategory.name && item.data().type === editingCategory.type
        );
        for (let start = 0; start < matches.length; start += 400) {
          const batch = writeBatch(db);
          matches.slice(start, start + 400).forEach((item) => batch.update(item.ref, { category: name }));
          await batch.commit();
        }
      } else {
        await addDoc(categoriesRef, { name, type: categoryForm.type, icon: "✦", createdAt: serverTimestamp() });
      }
      setCategoryModalOpen(false);
    } catch (error) {
      console.error("Save category error:", error);
      alert("Unable to save the category. Please try again.");
    } finally {
      setCategorySaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!currentUser || !window.confirm(`Delete the custom category “${category.name}”? Existing transactions will keep their recorded category label.`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "categories", category.id));
      if (category.type !== "income") {
        await deleteDoc(doc(db, "users", currentUser.uid, "categoryBudgets", categoryBudgetDocId(category.name)));
      }
    } catch (error) {
      console.error("Delete category error:", error);
      alert("Unable to delete this category. Please try again.");
    }
  };

  // Save a category order after moving an item to another item's position.
  const reorderCategoryToKey = async (type, sourceKey, targetKey) => {
    if (!currentUser || categoryOrderSaving || !sourceKey || !targetKey || sourceKey === targetKey) return;
    const list = type === "expense" ? expenseCategories : incomeCategories;
    const sourceIndex = list.findIndex((item) => categoryOrderKey(item) === sourceKey);
    const targetIndex = list.findIndex((item) => categoryOrderKey(item) === targetKey);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const reordered = [...list];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    const nextOrder = {
      ...categoryOrder,
      [type]: reordered.map((item) => categoryOrderKey(item)),
    };

    setCategoryOrderSaving(true);
    try {
      await savePreferences({ categoryOrder: nextOrder });
      setCategoryOrder(nextOrder);
    } catch (error) {
      console.error("Category reorder error:", error);
      alert("Unable to save the new category order. Please try again.");
    } finally {
      setCategoryOrderSaving(false);
    }
  };

  // Keep the accessible up/down controls and use the same persistence logic.
  const moveCategory = (type, index, direction) => {
    const list = type === "expense" ? expenseCategories : incomeCategories;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    void reorderCategoryToKey(
      type,
      categoryOrderKey(list[index]),
      categoryOrderKey(list[targetIndex])
    );
  };

  // Pointer-based dragging works with a mouse, stylus and touch screen.
  const startCategoryDrag = (event, type, item) => {
    if (categoryOrderSaving) return;
    event.preventDefault();
    const key = categoryOrderKey(item);
    const dragInfo = { type, key, pointerId: event.pointerId };
    categoryDragRef.current = dragInfo;
    categoryDropRef.current = key;
    setDraggingCategory(`${type}:${key}`);
    setDragOverCategory(`${type}:${key}`);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const updateCategoryDrag = (event) => {
    const activeDrag = categoryDragRef.current;
    if (!activeDrag) return;
    const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
    const hoveredRow = hoveredElement?.closest?.("[data-category-row]");
    if (!hoveredRow || hoveredRow.dataset.categoryType !== activeDrag.type) return;
    const targetKey = hoveredRow.dataset.categoryKey;
    if (!targetKey) return;
    categoryDropRef.current = targetKey;
    setDragOverCategory(`${activeDrag.type}:${targetKey}`);
  };

  const finishCategoryDrag = () => {
    const activeDrag = categoryDragRef.current;
    const targetKey = categoryDropRef.current;
    categoryDragRef.current = null;
    categoryDropRef.current = null;
    setDraggingCategory(null);
    setDragOverCategory(null);
    if (activeDrag && targetKey && activeDrag.key !== targetKey) {
      void reorderCategoryToKey(activeDrag.type, activeDrag.key, targetKey);
    }
  };

  const cancelCategoryDrag = () => {
    categoryDragRef.current = null;
    categoryDropRef.current = null;
    setDraggingCategory(null);
    setDragOverCategory(null);
  };

  const compressProfilePhoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported image."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const side = 256;
        canvas.width = side;
        canvas.height = side;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not prepare the profile image."));
          return;
        }
        // Center-crop to a square, then resize to keep the Firestore profile record small.
        const cropSide = Math.min(image.naturalWidth, image.naturalHeight);
        const cropX = (image.naturalWidth - cropSide) / 2;
        const cropY = (image.naturalHeight - cropSide) / 2;
        context.drawImage(image, cropX, cropY, cropSide, cropSide, 0, 0, side, side);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 250_000 && quality > 0.38) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length > 250_000) {
          reject(new Error("This image could not be compressed enough. Please choose another photo."));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });

  const handleProfilePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5 MB.");
      return;
    }

    setProfilePhotoBusy(true);
    try {
      const photoDataUrl = await compressProfilePhoto(file);
      await setDoc(doc(db, "users", currentUser.uid), {
        photoDataUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfilePhotoData(photoDataUrl);
      alert("Profile photo updated successfully.");
    } catch (error) {
      console.error("Profile photo upload error:", error);
      alert(error.message || "Unable to update your profile photo. Please try again.");
    } finally {
      setProfilePhotoBusy(false);
    }
  };

  const removeProfilePhoto = async () => {
    if (!profilePhotoData) return;
    if (!window.confirm("Remove your current profile photo?")) return;
    setProfilePhotoBusy(true);
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        photoDataUrl: "",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfilePhotoData("");
      setProfilePhotoPreviewOpen(false);
      alert("Profile photo removed.");
    } catch (error) {
      console.error("Profile photo removal error:", error);
      alert("Unable to remove your profile photo. Please try again.");
    } finally {
      setProfilePhotoBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const name = profileName.trim();
    const phone = profilePhone.trim();
    const country = profileCountry.trim();
    const occupation = profileOccupation.trim();
    if (!name) {
      alert("Please enter your name.");
      return;
    }
    if (phone && !/^\+?[0-9()\s-]{7,20}$/.test(phone)) {
      alert("Please enter a valid phone number, or leave the field empty.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await setDoc(doc(db, "users", currentUser.uid), {
        displayName: name,
        email: currentUser.email || "",
        phoneNumber: phone,
        country,
        occupation,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfileName(name);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Your profile could not be updated. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveCategoryBudget = async (categoryName) => {
    if (!currentUser) return;
    const enteredLimit = Number(categoryBudgetDrafts[categoryName]);
    if (!Number.isFinite(enteredLimit) || enteredLimit <= 0) {
      alert("Enter a category budget greater than zero.");
      return;
    }
    setCategoryBudgetSaving(categoryName);
    try {
      const budgetRef = doc(db, "users", currentUser.uid, "categoryBudgets", categoryBudgetDocId(categoryName));
      await setDoc(budgetRef, {
        categoryName,
        monthlyLimit: Number(enteredLimit.toFixed(2)),
        currencyCode: displayCurrencyCode,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert(`${categoryName} budget saved.`);
    } catch (error) {
      console.error("Category budget save error:", error);
      alert("Unable to save this category budget. Please try again.");
    } finally {
      setCategoryBudgetSaving("");
    }
  };

  const removeCategoryBudget = async (categoryName) => {
    if (!currentUser || !window.confirm(`Remove the monthly budget for ${categoryName}?`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "categoryBudgets", categoryBudgetDocId(categoryName)));
    } catch (error) {
      console.error("Category budget removal error:", error);
      alert("Unable to remove this category budget.");
    }
  };

  const openAddGoal = () => {
    setEditingGoalId(null);
    setGoalForm({ name: "", targetAmount: "100", deadline: "", description: "" });
    setGoalModalOpen(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setGoalForm({
      name: goal.name || "",
      targetAmount: convertCurrencyAmount(goal.targetAmount, goal.currencyCode || "INR", displayCurrencyCode).toFixed(2),
      deadline: goal.deadline || "",
      description: goal.description || "",
    });
    setGoalModalOpen(true);
  };

  const saveGoal = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const enteredTargetAmount = Number(goalForm.targetAmount);
    if (!goalForm.name.trim() || !Number.isFinite(enteredTargetAmount) || enteredTargetAmount <= 0 || !goalForm.deadline) {
      alert("Enter a goal name, a target greater than zero and a target date.");
      return;
    }
    setGoalSaving(true);
    try {
      const goalsRef = collection(db, "users", currentUser.uid, "savingsGoals");
      const payload = {
        name: goalForm.name.trim(),
        targetAmount: Number(enteredTargetAmount.toFixed(2)),
        currencyCode: displayCurrencyCode,
        deadline: goalForm.deadline,
        description: goalForm.description.trim(),
        updatedAt: serverTimestamp(),
      };
      if (editingGoalId) {
        const existingGoal = savingsGoals.find((item) => item.id === editingGoalId);
        const savedAmountInNewCurrency = convertCurrencyAmount(
          existingGoal?.savedAmount || 0,
          existingGoal?.savedAmountCurrencyCode || "INR",
          displayCurrencyCode
        );
        await updateDoc(doc(goalsRef, editingGoalId), {
          ...payload,
          savedAmount: Number(savedAmountInNewCurrency.toFixed(2)),
          savedAmountCurrencyCode: displayCurrencyCode,
        });
      } else {
        await addDoc(goalsRef, {
          ...payload,
          savedAmount: 0,
          savedAmountCurrencyCode: displayCurrencyCode,
          createdAt: serverTimestamp(),
        });
      }
      setGoalModalOpen(false);
    } catch (error) {
      console.error("Save savings goal error:", error);
      alert("Unable to save the savings goal. Please try again.");
    } finally {
      setGoalSaving(false);
    }
  };

  const deleteGoal = async (goal) => {
    if (!currentUser || !window.confirm(`Delete the savings goal “${goal.name}”?`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "savingsGoals", goal.id));
    } catch (error) {
      console.error("Delete savings goal error:", error);
      alert("Unable to delete this savings goal.");
    }
  };

  const openContribution = (goal) => {
    setSelectedGoalId(goal.id);
    setContributionAmount("100");
    setContributionModalOpen(true);
  };

  const saveContribution = async (event) => {
    event.preventDefault();
    const amountText = contributionAmount.trim();
    const amount = Number(amountText);
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid contribution amount, including up to two paise digits.");
      return;
    }
    if (!currentUser || !selectedGoalId) return;
    setContributionSaving(true);
    try {
      const goal = savingsGoals.find((item) => item.id === selectedGoalId);
      if (!goal) throw new Error("The selected savings goal could not be found.");
      const goalCurrencyCode = goal.currencyCode || "INR";
      const contributionInGoalCurrency = convertCurrencyAmount(amount, displayCurrencyCode, goalCurrencyCode);
      const goalRef = doc(db, "users", currentUser.uid, "savingsGoals", selectedGoalId);
      const contributionRef = doc(collection(db, "users", currentUser.uid, "savingsGoals", selectedGoalId, "contributions"));
      const batch = writeBatch(db);
      batch.set(contributionRef, {
        amount: Number(amount.toFixed(2)),
        currencyCode: displayCurrencyCode,
        goalCurrencyCode,
        amountInGoalCurrency: Number(contributionInGoalCurrency.toFixed(2)),
        createdAt: serverTimestamp(),
      });
      batch.update(goalRef, {
        savedAmount: increment(Number(contributionInGoalCurrency.toFixed(2))),
        savedAmountCurrencyCode: goalCurrencyCode,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setContributionModalOpen(false);
    } catch (error) {
      console.error("Savings contribution error:", error);
      alert("Unable to add this contribution.");
    } finally {
      setContributionSaving(false);
    }
  };

  const openAddRecurring = () => {
    setEditingRecurringId(null);
    setRecurringForm({ title: "", type: "expense", category: "Bills", amount: "100", account: "Bank Account", frequency: "monthly", nextDueDate: getDate(), note: "" });
    setRecurringModalOpen(true);
  };

  const openEditRecurring = (item) => {
    setEditingRecurringId(item.id);
    setRecurringForm({ title: item.title || "", type: item.type || "expense", category: item.category || "Bills", amount: convertCurrencyAmount(item.amount, item.currencyCode || "INR", displayCurrencyCode).toFixed(2), account: item.account || "Bank Account", frequency: item.frequency || "monthly", nextDueDate: item.nextDueDate || getDate(), note: item.note || "" });
    setRecurringModalOpen(true);
  };

  const saveRecurring = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const amountText = recurringForm.amount.trim();
    const amount = Number(amountText);
    if (!recurringForm.title.trim() || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || !recurringForm.nextDueDate) {
      alert("Enter a description, a valid amount and the first due date.");
      return;
    }
    const recurringAccount = accounts.find((item) => item.name === recurringForm.account);
    if (recurringAccount?.openingBalanceDate && recurringForm.nextDueDate < recurringAccount.openingBalanceDate) {
      alert("The first recurring date must be on or after the selected account's opening balance date.");
      return;
    }
    setRecurringSaving(true);
    try {
      const recurringRef = collection(db, "users", currentUser.uid, "recurringTransactions");
      const payload = {
        title: recurringForm.title.trim(), type: recurringForm.type, category: recurringForm.category,
        amount: Number(amount.toFixed(2)), currencyCode: displayCurrencyCode,
        account: recurringForm.account,
        accountId: accounts.find((item) => item.name === recurringForm.account)?.id || "",
        frequency: recurringForm.frequency,
        nextDueDate: recurringForm.nextDueDate, anchorDay: Number(recurringForm.nextDueDate.slice(8, 10)),
        note: recurringForm.note.trim(), active: editingRecurringId ? (recurringTransactions.find((item) => item.id === editingRecurringId)?.active !== false) : true,
        updatedAt: serverTimestamp(),
      };
      if (editingRecurringId) await updateDoc(doc(recurringRef, editingRecurringId), payload);
      else await addDoc(recurringRef, { ...payload, createdAt: serverTimestamp() });
      setRecurringModalOpen(false);
    } catch (error) {
      console.error("Save recurring schedule error:", error);
      alert("Unable to save the recurring schedule.");
    } finally {
      setRecurringSaving(false);
    }
  };

  const toggleRecurring = async (item) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "recurringTransactions", item.id), { active: item.active === false, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Toggle recurring schedule error:", error);
      alert("Unable to update this recurring schedule.");
    }
  };

  const deleteRecurring = async (item) => {
    if (!currentUser || !window.confirm(`Delete the recurring schedule “${item.title}”? Previously recorded transactions will remain.`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "recurringTransactions", item.id));
    } catch (error) {
      console.error("Delete recurring schedule error:", error);
      alert("Unable to delete this recurring schedule.");
    }
  };

  const openAddBillReminder = () => {
    setEditingBillReminderId(null);
    setBillReminderForm({ title: "", amount: "100", dueDate: getDate(), category: "Bills", account: "Bank Account", note: "" });
    setBillReminderModalOpen(true);
  };

  const openEditBillReminder = (item) => {
    setEditingBillReminderId(item.id);
    setBillReminderForm({
      title: item.title || "",
      amount: convertCurrencyAmount(item.amount, item.currencyCode || "INR", displayCurrencyCode).toFixed(2),
      dueDate: item.dueDate || getDate(),
      category: item.category || "Bills",
      account: item.account || "Bank Account",
      note: item.note || "",
    });
    setBillReminderModalOpen(true);
  };

  const saveBillReminder = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const amountText = billReminderForm.amount.trim();
    const amount = Number(amountText);
    if (!billReminderForm.title.trim() || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || !billReminderForm.dueDate) {
      alert("Enter a bill name, a valid amount and a due date.");
      return;
    }
    setBillReminderSaving(true);
    try {
      const remindersRef = collection(db, "users", currentUser.uid, "billReminders");
      const payload = {
        title: billReminderForm.title.trim(),
        amount: Number(amount.toFixed(2)),
        currencyCode: displayCurrencyCode,
        dueDate: billReminderForm.dueDate,
        category: billReminderForm.category,
        account: billReminderForm.account,
        accountId: accounts.find((item) => item.name === billReminderForm.account)?.id || "",
        note: billReminderForm.note.trim(),
        updatedAt: serverTimestamp(),
      };
      if (editingBillReminderId) await updateDoc(doc(remindersRef, editingBillReminderId), payload);
      else await addDoc(remindersRef, { ...payload, paid: false, createdAt: serverTimestamp() });
      setBillReminderModalOpen(false);
    } catch (error) {
      console.error("Save bill reminder error:", error);
      alert("Unable to save this bill reminder.");
    } finally {
      setBillReminderSaving(false);
    }
  };

  const toggleBillPaid = async (item) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "billReminders", item.id), {
        paid: item.paid !== true,
        paidAt: item.paid === true ? null : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Bill reminder status update error:", error);
      alert("Unable to update this bill reminder.");
    }
  };

  const deleteBillReminder = async (item) => {
    if (!currentUser || !window.confirm(`Delete the reminder for “${item.title}”?`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "billReminders", item.id));
    } catch (error) {
      console.error("Delete bill reminder error:", error);
      alert("Unable to delete this bill reminder.");
    }
  };

  const openAddSplitExpense = () => {
    setSplitForm({ title: "", amount: "100", date: getDate(), category: "Food", participants: "" });
    setSplitModalOpen(true);
  };

  const saveSplitExpense = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const amountText = splitForm.amount.trim();
    const total = Number(amountText);
    const names = [...new Set(splitForm.participants.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))].slice(0, 20);
    if (!splitForm.title.trim() || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !Number.isFinite(total) || total <= 0 || !splitForm.date || !names.length) {
      alert("Enter a description, a valid amount, a date and at least one participant name.");
      return;
    }
    setSplitSaving(true);
    try {
      const participantCount = names.length + 1;
      const perShare = Math.floor((total / participantCount) * 100) / 100;
      let remainder = Number((total - perShare * participantCount).toFixed(2));
      const participants = [
        { id: "self", name: currentUser.displayName || currentUser.email || "You", email: currentUser.email || "", shareAmount: Number((perShare + remainder).toFixed(2)), settled: true, isOwner: true },
        ...names.map((name, index) => ({ id: `person_${index}`, name: name.replace(/\s*<.*>$/, "").trim(), email: (name.match(/<([^>]+)>/) || [])[1] || "", shareAmount: perShare, settled: false, isOwner: false })),
      ];
      await addDoc(collection(db, "users", currentUser.uid, "splitExpenses"), {
        title: splitForm.title.trim(), totalAmount: Number(total.toFixed(2)), currencyCode: displayCurrencyCode,
        date: splitForm.date, category: splitForm.category, paidByUid: currentUser.uid,
        paidByEmail: currentUser.email || "", participants, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setSplitModalOpen(false);
    } catch (error) {
      console.error("Split expense save error:", error);
      alert("Unable to save the split expense.");
    } finally { setSplitSaving(false); }
  };

  const toggleSplitSettlement = async (expense, participantId) => {
    if (!currentUser) return;
    const participants = (expense.participants || []).map((person) => person.id === participantId
      ? { ...person, settled: !person.settled, settledAt: person.settled ? null : new Date().toISOString() } : person);
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "splitExpenses", expense.id), { participants, updatedAt: serverTimestamp() });
    } catch (error) { console.error("Split settlement update error:", error); alert("Unable to update settlement status."); }
  };

  const deleteSplitExpense = async (expense) => {
    if (!currentUser || !window.confirm(`Delete the split expense “${expense.title}”?`)) return;
    try { await deleteDoc(doc(db, "users", currentUser.uid, "splitExpenses", expense.id)); }
    catch (error) { console.error("Split expense delete error:", error); alert("Unable to delete this split expense."); }
  };

  const openCreateSharedBudget = () => {
    setSharedBudgetForm({ name: "", monthlyLimit: "100", memberEmails: "", description: "" });
    setSharedBudgetModalOpen(true);
  };

  const saveSharedBudget = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const limitText = sharedBudgetForm.monthlyLimit.trim();
    const limit = Number(limitText);
    const emails = [...new Set(sharedBudgetForm.memberEmails.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))];
    const invalidEmail = emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (!sharedBudgetForm.name.trim() || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(limitText) || !Number.isFinite(limit) || limit <= 0 || invalidEmail) {
      alert("Enter a shared budget name, a valid limit and valid email addresses.");
      return;
    }
    if (emails.some((email) => email.toLowerCase() === String(currentUser.email || "").toLowerCase())) {
      alert("You are already the owner. Remove your own email from the invitation list.");
      return;
    }
    setSharedBudgetSaving(true);
    try {
      const created = await addDoc(collection(db, "sharedBudgets"), {
        name: sharedBudgetForm.name.trim(), description: sharedBudgetForm.description.trim(),
        monthlyLimit: Number(limit.toFixed(2)), currencyCode: displayCurrencyCode,
        ownerUid: currentUser.uid, ownerEmail: currentUser.email || "", ownerName: currentUser.displayName || "FinPilot User",
        memberEmails: emails, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setSelectedSharedBudgetId(created.id);
      setSharedBudgetModalOpen(false);
    } catch (error) {
      console.error("Shared budget creation error:", error);
      alert("Unable to create the shared budget. Check that the updated Firestore rules have been published.");
    } finally { setSharedBudgetSaving(false); }
  };

  const addSharedBudgetExpense = async (event) => {
    event.preventDefault();
    if (!currentUser || !selectedSharedBudget) return;
    const amountText = sharedExpenseForm.amount.trim();
    const amount = Number(amountText);
    if (!sharedExpenseForm.title.trim() || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || !sharedExpenseForm.date) {
      alert("Enter an expense description, a valid amount and a date."); return;
    }
    setSharedExpenseSaving(true);
    try {
      await addDoc(collection(db, "sharedBudgets", selectedSharedBudget.id, "entries"), {
        title: sharedExpenseForm.title.trim(), amount: Number(amount.toFixed(2)), currencyCode: displayCurrencyCode,
        date: sharedExpenseForm.date, category: sharedExpenseForm.category, note: sharedExpenseForm.note.trim(),
        createdBy: currentUser.uid, createdByEmail: currentUser.email || "", createdByName: currentUser.displayName || currentUser.email || "Member",
        createdAt: serverTimestamp(),
      });
      setSharedExpenseModalOpen(false);
    } catch (error) {
      console.error("Shared budget expense error:", error);
      alert("Unable to add this shared expense. Check the shared budget permissions.");
    } finally { setSharedExpenseSaving(false); }
  };

  const deleteSharedBudget = async (budgetItem) => {
    if (!currentUser || budgetItem.ownerUid !== currentUser.uid || !window.confirm(`Delete the shared budget “${budgetItem.name}” and its shared entries?`)) return;
    try {
      const entrySnapshot = await getDocs(collection(db, "sharedBudgets", budgetItem.id, "entries"));
      for (let start = 0; start < entrySnapshot.docs.length; start += 400) {
        const batch = writeBatch(db);
        entrySnapshot.docs.slice(start, start + 400).forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, "sharedBudgets", budgetItem.id));
      if (selectedSharedBudgetId === budgetItem.id) setSelectedSharedBudgetId("");
    }
    catch (error) { console.error("Shared budget delete error:", error); alert("Unable to delete this shared budget."); }
  };

  const scanReceipt = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const lowerName = String(file.name || "").toLowerCase();
    const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lowerName);
    if (!isPdf && !isImage) {
      alert("Choose a receipt as JPG, PNG, WebP or PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Choose a receipt file smaller than 10 MB.");
      return;
    }

    setReceiptScanning(true);
    setReceiptProgress(0);
    setReceiptText("");
    setReceiptDraft(null);
    let worker;

    try {
      let extractedText = "";
      if (isPdf) {
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
          isEvalSupported: false,
          useWorkerFetch: false,
        }).promise;

        if (pdf.numPages > 5) {
          throw new Error("Receipt PDFs can contain up to 5 pages. For longer documents, use Statement Import.");
        }

        const pdfPages = [];
        let selectableTextLength = 0;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const groupedLines = [];

          for (const item of content.items || []) {
            if (!item.str || !item.str.trim()) continue;
            const x = Number(item.transform?.[4] || 0);
            const y = Number(item.transform?.[5] || 0);
            let line = groupedLines.find((candidate) => Math.abs(candidate.y - y) <= 2.4);
            if (!line) {
              line = { y, items: [] };
              groupedLines.push(line);
            }
            line.items.push({ x, text: item.str });
          }

          const pageText = groupedLines
            .sort((a, b) => b.y - a.y)
            .map((line) => line.items
              .sort((a, b) => a.x - b.x)
              .map((item) => item.text)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim())
            .filter(Boolean)
            .join("\n");

          selectableTextLength += pageText.length;
          pdfPages.push(page);
          if (pageText) extractedText += `${pageText}\n`;
          setReceiptProgress(Math.round((pageNumber / pdf.numPages) * 25));
        }

        // Searchable PDFs can be read directly. Scanned PDFs have no selectable text,
        // so render each page locally and recognise it with Tesseract.js.
        if (selectableTextLength < 25) {
          const { createWorker } = await import("tesseract.js");
          worker = await createWorker("eng", 1, {
            logger: (message) => {
              if (message.status === "recognizing text") {
                const progress = Math.round((message.progress || 0) * 75);
                setReceiptProgress((old) => Math.max(old, 25 + progress));
              }
            },
          });
          extractedText = "";
          for (let index = 0; index < pdfPages.length; index += 1) {
            const page = pdfPages[index];
            const viewport = page.getViewport({ scale: 1.8 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) throw new Error("Your browser could not prepare the PDF page for OCR.");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: context, viewport }).promise;
            const result = await worker.recognize(canvas);
            extractedText += `${result?.data?.text || ""}\n`;
            canvas.width = 0;
            canvas.height = 0;
            setReceiptProgress(25 + Math.round(((index + 1) / pdfPages.length) * 75));
          }
        } else {
          setReceiptProgress(100);
        }
      } else {
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker("eng", 1, {
          logger: (message) => {
            if (message.status === "recognizing text") {
              setReceiptProgress(Math.round((message.progress || 0) * 100));
            }
          },
        });
        const result = await worker.recognize(file);
        extractedText = result?.data?.text || "";
        setReceiptProgress(100);
      }

      setReceiptText(extractedText);
      const parsed = parseOcrReceipt(extractedText);
      setReceiptDraft({ ...parsed, sourceType: isPdf ? "PDF" : "image" });
      if (!extractedText.trim()) {
        alert("No readable text was detected. Try a clearer receipt image or a higher-quality PDF.");
      }
    } catch (error) {
      console.error("Receipt scanning error:", error);
      alert(error instanceof Error ? error.message : "Receipt scanning failed. Check that PDF.js and Tesseract.js are installed and the English OCR data can be downloaded.");
    } finally {
      if (worker) {
        try { await worker.terminate(); } catch { /* Worker already stopped. */ }
      }
      setReceiptScanning(false);
    }
  };

  const useReceiptDraft = () => {
    if (!receiptDraft) return;
    const title = receiptDraft.title || "Receipt purchase";
    const suggestion = inferTransactionCategory(title, "expense", expenseCategories);
    setForm({ title, type: "expense", category: suggestion?.name || "Other", amount: receiptDraft.amount || "100", date: receiptDraft.date || getDate(), account: "UPI", note: "Created from a locally scanned receipt. Please verify the details." });
    setModalOpen(true);
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) { setNotificationPermission("unsupported"); alert("This browser does not support desktop notifications."); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") alert("Browser reminders enabled. FinPilot can alert you while the app is open.");
      else alert("Notification permission was not granted. In-app due and overdue reminders remain available.");
    } catch (error) { console.error("Notification permission error:", error); }
  };

  const sendAssistantQuestion = async (event) => {
    event.preventDefault();
    const question = assistantQuestion.trim();
    if (!question || assistantBusy) return;
    setAssistantQuestion("");
    setAssistantMessages((old) => [...old, { role: "user", text: question }]);
    setAssistantBusy(true);
    try {
      let answer = "I can help with your recorded income, expenses, savings, budgets, categories and recent transactions. Try asking: ‘How much did I spend this month?’, ‘What is my largest expense?’ or ‘How much budget is left?’";
      const endpoint = import.meta.env.VITE_FINPILOT_AI_ENDPOINT;
      if (endpoint) {
        const token = await currentUser.getIdToken();
        const response = await fetch(endpoint, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ question, context: {
            currency: displayCurrencyCode, monthlyIncome: displayMoney(income), monthlyExpenses: displayMoney(expenses),
            netSavings: displayMoney(savings), savingsRate: Number(savingsRate.toFixed(1)),
            topCategories: categoryTotals.slice(0, 5).map((item) => ({ category: item.name, amount: displayMoney(item.amount) })),
            budgetRemaining: displayMoney(Math.max(0, budgetInInr - expenses)),
          } }),
        });
        if (!response.ok) throw new Error(`Assistant endpoint returned ${response.status}.`);
        const payload = await response.json();
        answer = String(payload.answer || payload.message || answer);
      } else {
        const q = question.toLowerCase();
        if (/how much|total|spent|expense/.test(q) && /(month|this month|spend|expense)/.test(q)) {
          answer = `You have recorded ${displayMoney(expenses)} in expenses this month and ${displayMoney(income)} in income. Your net savings are ${displayMoney(savings)} (${savingsRate.toFixed(1)}% of recorded income).`;
        } else if (/largest|biggest|top expense/.test(q)) {
          answer = topExpenses.length ? `Your largest expense this month is “${topExpenses[0].title}” in ${topExpenses[0].category}: ${transactionMoney(topExpenses[0])} on ${formatDate(topExpenses[0].date, dateFormat)}.` : "There are no expense transactions recorded for this month yet.";
        } else if (/category|where.*money|spend.*most/.test(q)) {
          answer = categoryTotals.length ? `Your highest spending category is ${categoryTotals[0].name} at ${displayMoney(categoryTotals[0].amount)}. The next categories are ${categoryTotals.slice(1, 4).map((item) => `${item.name} (${displayMoney(item.amount)})`).join(", ") || "none yet"}.` : "No expense categories have spending recorded this month yet.";
        } else if (/budget|remaining|left/.test(q)) {
          answer = `Your overall monthly budget is ${displayMoney(budgetInInr)}. You have used ${displayMoney(expenses)} (${budgetUsed.toFixed(1)}%) and have ${displayMoney(Math.max(0, budgetInInr - expenses))} remaining.`;
        } else if (/save|saving/.test(q)) {
          answer = `Your net recorded savings this month are ${displayMoney(savings)} and your savings rate is ${savingsRate.toFixed(1)}%. ${savings >= 0 ? "Your recorded income currently exceeds expenses." : "Your recorded expenses currently exceed income."}`;
        } else if (/forecast|predict|next month/.test(q)) {
          answer = `Based on the current month-to-date pace and up to three prior completed months, estimated month-end expenses are ${displayMoney(predictedMonthEndExpenses)}. This is a simple projection, not a guarantee.`;
        } else if (/health|score/.test(q)) {
          answer = `Your FinPilot Financial Health Score is ${financialHealthScore}/100 (${financialHealthLabel}). It combines savings rate, budget control, expense stability and record-keeping activity.`;
        } else if (/transaction|recent/.test(q)) {
          const recent = transactions.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
          answer = recent.length ? `Your five most recent records are: ${recent.map((item) => `${item.title} (${transactionMoney(item)}, ${formatDate(item.date, dateFormat)})`).join("; ")}.` : "You have not recorded any transactions yet.";
        }
      }
      setAssistantMessages((old) => [...old, { role: "assistant", text: answer }]);
    } catch (error) {
      console.error("Financial assistant error:", error);
      setAssistantMessages((old) => [...old, { role: "assistant", text: "The connected AI service could not be reached. The local finance insights remain available; check your secure assistant endpoint configuration." }]);
    } finally { setAssistantBusy(false); }
  };

  const saveAppSettings = async (event) => {
    event.preventDefault();
    if (!exchangeRates[draftCurrencyCode]) {
      alert("The selected currency rate is not available yet. Please choose another currency.");
      return;
    }
    setSettingsSaving(true);
    try {
      await savePreferences({ theme: draftTheme, dateFormat: draftDateFormat, currencyCode: draftCurrencyCode });
      // Apply preferences only after Firestore confirms that Save Settings succeeded.
      setTheme(draftTheme);
      setSavedTheme(draftTheme);
      setDateFormat(draftDateFormat);
      setCurrencyCode(draftCurrencyCode);
      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Settings update error:", error);
      alert("Unable to save settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const openBudgetEditor = () => {
    setMonthlyBudgetDraft(convertCurrencyAmount(budget, budgetCurrencyCode, displayCurrencyCode).toFixed(2));
    setBudgetModalOpen(true);
  };

  const saveBudget = async (event) => {
    event.preventDefault();
    const enteredValue = Number(monthlyBudgetDraft);
    if (!Number.isFinite(enteredValue) || enteredValue <= 0) {
      alert("Please enter a valid budget greater than zero.");
      return;
    }
    try {
      const storedAmount = Number(enteredValue.toFixed(2));
      await savePreferences({
        monthlyBudget: storedAmount,
        monthlyBudgetCurrencyCode: displayCurrencyCode,
      });
      setBudget(storedAmount);
      setBudgetCurrencyCode(displayCurrencyCode);
      localStorage.setItem("finpilot_budget", JSON.stringify({ amount: storedAmount, currencyCode: displayCurrencyCode }));
      setBudgetModalOpen(false);
    } catch (error) {
      console.error("Budget update error:", error);
      alert("Unable to save your budget. Please try again.");
    }
  };

  const openAddAccount = () => {
    setEditingAccountId(null);
    setAccountForm({ name: "", type: "bank", currencyCode: displayCurrencyCode, openingBalance: "0", openingBalanceDate: getDate() });
    setAccountModalOpen(true);
  };

  const openEditAccount = (account) => {
    setEditingAccountId(account.id);
    setAccountForm({
      name: account.name || "", type: account.type || "other",
      currencyCode: account.currencyCode || "INR",
      openingBalance: String(account.openingBalance ?? 0),
      openingBalanceDate: account.openingBalanceDate || "1900-01-01",
    });
    setAccountModalOpen(true);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const name = accountForm.name.trim();
    const openingBalance = Number(accountForm.openingBalance);
    if (!name || !Number.isFinite(openingBalance) || openingBalance < 0 || !/^[A-Z]{3}$/.test(accountForm.currencyCode)) {
      alert("Enter an account name and a valid non-negative opening balance.");
      return;
    }
    if (!accountForm.openingBalanceDate || accountForm.openingBalanceDate > getDate()) {
      alert("Opening balance date cannot be later than today."); return;
    }
    if (accounts.some((item) => item.id !== editingAccountId && item.name.toLowerCase() === name.toLowerCase())) {
      alert("An account with this name already exists.");
      return;
    }
    const editingAccount = accounts.find((item) => item.id === editingAccountId);
    const hasHistory = editingAccount && (transactions.some((item) => item.accountId === editingAccountId || item.account === editingAccount.name)
      || transfers.some((item) => item.fromAccountId === editingAccountId || item.toAccountId === editingAccountId));
    if (hasHistory && (editingAccount.currencyCode || "INR") !== accountForm.currencyCode) {
      alert("The currency of an account with financial history cannot be changed. Create a new account in the other currency to preserve historical balances."); return;
    }
    setAccountSaving(true);
    const accountsRef = collection(db, "users", currentUser.uid, "accounts");
    const payload = {
      name, type: accountForm.type, currencyCode: accountForm.currencyCode,
      openingBalance: Number(openingBalance.toFixed(2)),
      openingBalanceDate: accountForm.openingBalanceDate || getDate(), updatedAt: serverTimestamp(),
    };
    try {
      if (editingAccountId) {
        const oldName = editingAccount.name;
        await updateDoc(doc(accountsRef, editingAccountId), payload);

        // Keep the account label consistent across all records that reference it.
        const updateLinkedRecords = async (collectionName, items, predicate, patchForItem) => {
          const linked = items.filter(predicate);
          for (let start = 0; start < linked.length; start += 400) {
            const batch = writeBatch(db);
            linked.slice(start, start + 400).forEach((item) => {
              batch.update(doc(db, "users", currentUser.uid, collectionName, item.id), patchForItem(item));
            });
            await batch.commit();
          }
        };

        await updateLinkedRecords(
          "transactions",
          transactions,
          (item) => item.accountId === editingAccountId || (!item.accountId && item.account === oldName),
          () => ({ account: name, accountId: editingAccountId })
        );
        await updateLinkedRecords(
          "recurringTransactions",
          recurringTransactions,
          (item) => item.accountId === editingAccountId || item.account === oldName,
          () => ({ account: name, accountId: editingAccountId, updatedAt: serverTimestamp() })
        );
        await updateLinkedRecords(
          "billReminders",
          billReminders,
          (item) => item.accountId === editingAccountId || item.account === oldName,
          () => ({ account: name, accountId: editingAccountId, updatedAt: serverTimestamp() })
        );
        await updateLinkedRecords(
          "transfers",
          transfers,
          (item) => item.fromAccountId === editingAccountId || item.toAccountId === editingAccountId,
          (item) => ({
            ...(item.fromAccountId === editingAccountId ? { fromAccountName: name } : {}),
            ...(item.toAccountId === editingAccountId ? { toAccountName: name } : {}),
            updatedAt: serverTimestamp(),
          })
        );
      } else {
        await addDoc(accountsRef, { ...payload, createdAt: serverTimestamp(), isDefault: false });
      }
      setAccountModalOpen(false);
    } catch (error) {
      console.error("Account save error:", error);
      alert("Unable to save the account. Please try again.");
    } finally { setAccountSaving(false); }
  };

  const deleteAccount = async (account) => {
    if (!currentUser) return;
    const usedByTransactions = transactions.some((item) => item.accountId === account.id || (!item.accountId && String(item.account || "").toLowerCase() === String(account.name || "").toLowerCase()));
    const usedByTransfers = transfers.some((item) => item.fromAccountId === account.id || item.toAccountId === account.id);
    const usedBySchedules = recurringTransactions.some((item) => item.accountId === account.id || item.account === account.name);
    const usedByReminders = billReminders.some((item) => item.accountId === account.id || item.account === account.name);
    const currentBalance = getAccountBalance(account);
    const hasNonZeroBalance = Math.abs(currentBalance) >= 0.005;
    if (usedByTransactions || usedByTransfers || usedBySchedules || usedByReminders || hasNonZeroBalance) {
      alert("This account has linked financial history or a non-zero balance. Transfer or settle the funds and preserve the historical records before removing it. Accounts with financial history cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete the empty account “${account.name}”?`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "accounts", account.id));
    } catch (error) {
      console.error("Account delete error:", error);
      alert("Unable to delete this account.");
    }
  };

  const openTransferModal = () => {
    const firstAccount = accounts[0]?.id || "";
    const secondAccount = accounts.find((item) => item.id !== firstAccount)?.id || "";
    setTransferForm({ fromAccountId: firstAccount, toAccountId: secondAccount, amount: "100", date: getDate(), note: "" });
    setTransferModalOpen(true);
  };

  const saveTransfer = async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const source = accounts.find((item) => item.id === transferForm.fromAccountId);
    const target = accounts.find((item) => item.id === transferForm.toAccountId);
    const enteredAmount = Number(transferForm.amount);
    if (!source || !target || source.id === target.id || !Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      alert("Choose two different accounts and enter a valid transfer amount.");
      return;
    }
    if (!transferForm.date || transferForm.date > getDate()) {
      alert("Transfer date cannot be later than today.");
      return;
    }
    if ((source.openingBalanceDate && transferForm.date < source.openingBalanceDate)
      || (target.openingBalanceDate && transferForm.date < target.openingBalanceDate)) {
      alert("The transfer date must be on or after the opening balance date of both accounts.");
      return;
    }
    const sourceAmount = convertCurrencyAmount(enteredAmount, displayCurrencyCode, source.currencyCode || "INR");
    const targetAmount = convertCurrencyAmount(enteredAmount, displayCurrencyCode, target.currencyCode || "INR");
    if (!getCurrencyRate(source.currencyCode || "INR") || !getCurrencyRate(target.currencyCode || "INR")) {
      alert("The exchange rate for one of these accounts is unavailable. Refresh rates or choose another account currency.");
      return;
    }
    const availableAtTransferDate = getAccountBalanceAtDate(source, transferForm.date);
    if (availableAtTransferDate + 0.000001 < sourceAmount) {
      alert(`Insufficient balance in ${source.name} on ${transferForm.date}. Available on that date: ${money(availableAtTransferDate, source.currencyCode || "INR", 1)}.`);
      return;
    }
    setTransferSaving(true);
    try {
      await addDoc(collection(db, "users", currentUser.uid, "transfers"), {
        fromAccountId: source.id, fromAccountName: source.name,
        toAccountId: target.id, toAccountName: target.name,
        enteredAmount: Number(enteredAmount.toFixed(2)), enteredCurrencyCode: displayCurrencyCode,
        fromAmount: Number(sourceAmount.toFixed(2)), fromCurrencyCode: source.currencyCode || "INR",
        toAmount: Number(targetAmount.toFixed(2)), toCurrencyCode: target.currencyCode || "INR",
        date: transferForm.date, note: transferForm.note.trim(),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setTransferModalOpen(false);
    } catch (error) {
      console.error("Transfer save error:", error);
      alert("Unable to save the transfer. Please try again.");
    } finally { setTransferSaving(false); }
  };

  const connectDemoBank = async (bank) => {
    if (!currentUser) return;
    if (!bankDemoConsentAccepted) {
      alert("Please confirm that you understand this is a sample-data demonstration.");
      return;
    }
    setBankDemoBusyId(bank.id);
    setBankDemoMessage("");
    try {
      const connectionRef = doc(db, "users", currentUser.uid, "bankSyncDemoConnections", bank.id);
      await setDoc(connectionRef, {
        providerId: bank.id,
        providerName: bank.name,
        accountId: `demo_account_${bank.id}`,
        status: "connected",
        mode: "simulation",
        simulationOnly: true,
        consentAccepted: true,
        consentAcceptedAt: serverTimestamp(),
        connectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setBankDemoMessage(`${bank.name} is connected in simulation mode. No real bank was contacted.`);
    } catch (error) {
      console.error("Demo bank connection error:", error);
      alert("Could not connect the sample bank. Check your Firestore rules and connection.");
    } finally {
      setBankDemoBusyId("");
    }
  };

  const syncDemoBank = async (bank) => {
    if (!currentUser) return;
    const connection = bankSyncDemoConnections.find((item) => item.id === bank.id);
    if (!connection || connection.status !== "connected") {
      alert("Connect this sample bank first.");
      return;
    }
    setBankDemoBusyId(bank.id);
    setBankDemoMessage("");
    try {
      const accountId = `demo_account_${bank.id}`;
      const accountName = `${bank.name} Savings (Demo)`;
      const accountRef = doc(db, "users", currentUser.uid, "accounts", accountId);
      const existingAccount = await getDoc(accountRef);
      if (!existingAccount.exists()) {
        await setDoc(accountRef, {
          name: accountName,
          type: "bank",
          currencyCode: "INR",
          openingBalance: bank.openingBalance,
          openingBalanceDate: toLocalDateInput(new Date(Date.now() - 30 * 86400000)),
          isDemo: true,
          demoProviderId: bank.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
      const existingTransactions = await getDocs(transactionsRef);
      const existingIds = new Set(existingTransactions.docs.map((item) => item.id));
      const batch = writeBatch(db);
      let importedCount = 0;
      bank.transactions.forEach((sample) => {
        const transactionId = `demo_${bank.id}_${sample.id}`;
        if (existingIds.has(transactionId)) return;
        const amount = Number(sample.amount.toFixed(2));
        const transactionDate = toLocalDateInput(new Date(Date.now() - sample.daysAgo * 86400000));
        batch.set(doc(transactionsRef, transactionId), {
          title: sample.title,
          type: sample.type,
          category: sample.category,
          amount,
          currencyCode: "INR",
          date: transactionDate,
          account: accountName,
          accountId,
          accountAmount: amount,
          accountCurrencyCode: "INR",
          note: `DEMO DATA — ${sample.note}`,
          isDemo: true,
          source: "bank_sync_demo",
          demoBankId: bank.id,
          externalTransactionId: sample.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          importedAt: serverTimestamp(),
        });
        importedCount += 1;
      });
      if (importedCount > 0) await batch.commit();

      await setDoc(doc(db, "users", currentUser.uid, "bankSyncDemoConnections", bank.id), {
        lastSyncAt: serverTimestamp(),
        lastSyncCount: importedCount,
        lastSyncStatus: "success",
        status: "connected",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBankDemoMessage(importedCount
        ? `Sync complete: ${importedCount} new sample transaction(s) imported into ${accountName}. Repeating Sync will not create duplicates.`
        : `Sync complete: all ${bank.transactions.length} sample transaction(s) were already imported. No duplicates were created.`);
    } catch (error) {
      console.error("Demo bank sync error:", error);
      alert("Sample sync failed. Check Firestore permissions and try again.");
    } finally {
      setBankDemoBusyId("");
    }
  };

  const disconnectDemoBank = async (bank) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid, "bankSyncDemoConnections", bank.id), {
        status: "disconnected", disconnectedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true });
      setBankDemoMessage(`${bank.name} demo connection disconnected. Previously imported sample records were kept.`);
    } catch (error) {
      console.error("Demo bank disconnect error:", error);
      alert("Unable to disconnect this demo bank.");
    }
  };

  const removeDemoBankData = async (bank) => {
    if (!currentUser) return;
    if (!window.confirm(`Remove the sample transactions and demo account for ${bank.name}? Real transactions and accounts will not be affected.`)) return;
    setBankDemoBusyId(bank.id);
    try {
      const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
      const transactionSnapshot = await getDocs(transactionsRef);
      const demoDocs = transactionSnapshot.docs.filter((item) => item.data().source === "bank_sync_demo" && item.data().demoBankId === bank.id);
      for (let offset = 0; offset < demoDocs.length; offset += 450) {
        const batch = writeBatch(db);
        demoDocs.slice(offset, offset + 450).forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }

      const accountId = `demo_account_${bank.id}`;
      const remainingTransactions = transactionSnapshot.docs.filter((item) =>
        !(item.data().source === "bank_sync_demo" && item.data().demoBankId === bank.id)
      );
      const accountStillUsed = remainingTransactions.some((item) => item.data().accountId === accountId);
      const transferSnapshot = await getDocs(collection(db, "users", currentUser.uid, "transfers"));
      const transferStillUsesAccount = transferSnapshot.docs.some((item) => item.data().fromAccountId === accountId || item.data().toAccountId === accountId);
      if (!accountStillUsed && !transferStillUsesAccount) {
        await deleteDoc(doc(db, "users", currentUser.uid, "accounts", accountId));
      }
      await deleteDoc(doc(db, "users", currentUser.uid, "bankSyncDemoConnections", bank.id));
      setBankDemoMessage(`Removed ${demoDocs.length} sample transaction(s) for ${bank.name}.`);
    } catch (error) {
      console.error("Remove demo bank data error:", error);
      alert("Could not remove all demo data. Check your Firestore permissions and try again.");
    } finally {
      setBankDemoBusyId("");
    }
  };

  const exportFullBackup = async () => {
    if (!currentUser || backupExporting) return;
    setBackupExporting(true);
    try {
      const sharedBudgetList = [...new Map(
        [...ownedSharedBudgets, ...invitedSharedBudgets].map((item) => [item.id, item])
      ).values()];
      const sharedBudgetsWithEntries = await Promise.all(sharedBudgetList.map(async (budgetItem) => {
        const snapshot = await getDocs(collection(db, "sharedBudgets", budgetItem.id, "entries"));
        return {
          budget: budgetItem,
          entries: snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })),
        };
      }));
      const savingsGoalsWithContributions = await Promise.all(savingsGoals.map(async (goal) => {
        const snapshot = await getDocs(collection(db, "users", currentUser.uid, "savingsGoals", goal.id, "contributions"));
        return {
          ...goal,
          contributions: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
        };
      }));
      const backup = {
        application: "FinPilot",
        formatVersion: 2,
        exportedAt: new Date().toISOString(),
        user: { uid: currentUser.uid, email: currentUser.email || "", displayName: profileName || currentUser.displayName || "", phone: profilePhone || "", country: profileCountry || "", occupation: profileOccupation || "", profilePhotoData: profilePhotoData || "" },
        preferences: { theme, dateFormat, preferredCurrency: currencyCode },
        categoryOrder,
        accounts,
        transactions,
        transfers,
        categories: customCategories,
        categoryBudgets,
        monthlyBudget: { amount: budget, currencyCode: budgetCurrencyCode },
        savingsGoals: savingsGoalsWithContributions,
        recurringTransactions,
        billReminders,
        splitExpenses,
        sharedBudgets: sharedBudgetsWithEntries,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finpilot-backup-${getDate()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Full data backup error:", error);
      alert("Could not export every record. Check your connection and shared-budget access, then try again.");
    } finally {
      setBackupExporting(false);
    }
  };

  const handleCsvFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setCsvImportRows([]);
    setCsvImportErrors([]);
    setCsvImportResult("");
    setCsvImportFileName("");
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
    const isCsv = lowerName.endsWith(".csv") || file.type === "text/csv";
    const maxSize = isPdf ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!isPdf && !isCsv) {
      alert("Choose a bank statement in CSV or PDF format.");
      return;
    }
    if (file.size > maxSize) {
      alert(isPdf ? "Choose a PDF statement smaller than 15 MB." : "Choose a CSV statement smaller than 5 MB.");
      return;
    }

    setStatementParsing(true);
    setStatementProgress(0);
    try {
      let valid = [];
      let errors = [];
      if (isPdf) {
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
          isEvalSupported: false,
          useWorkerFetch: false,
        }).promise;
        if (pdf.numPages > 25) throw new Error("This PDF has more than 25 pages. Split it into smaller statements and upload each part separately.");
        const pages = [];
        let extractedCharacters = 0;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const grouped = [];
          for (const item of content.items || []) {
            if (!item.str || !item.str.trim()) continue;
            const x = Number(item.transform?.[4] || 0);
            const y = Number(item.transform?.[5] || 0);
            let line = grouped.find((candidate) => Math.abs(candidate.y - y) <= 2.4);
            if (!line) { line = { y, items: [] }; grouped.push(line); }
            line.items.push({ x, text: item.str });
          }
          const pageLines = grouped
            .sort((a, b) => b.y - a.y)
            .map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").replace(/\s+/g, " ").trim())
            .filter(Boolean);
          extractedCharacters += pageLines.join(" ").length;
          pages.push({ page, lines: pageLines });
          setStatementProgress(Math.round((pageNumber / pdf.numPages) * 35));
        }

        let lines = pages.flatMap((page) => page.lines);
        if (extractedCharacters < 30) {
          // Scanned PDFs have no selectable text. Render their pages locally and use Tesseract OCR.
          let worker;
          try {
            const { createWorker } = await import("tesseract.js");
            worker = await createWorker("eng", 1, {
              logger: (message) => {
                if (message.status === "recognizing text") {
                  const pageProgress = Math.round((message.progress || 0) * 65);
                  setStatementProgress((old) => Math.max(old, 35 + pageProgress));
                }
              },
            });
            lines = [];
            for (let index = 0; index < pages.length; index += 1) {
              const page = pages[index].page;
              const viewport = page.getViewport({ scale: 1.65 });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d", { willReadFrequently: true });
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              await page.render({ canvasContext: context, viewport }).promise;
              const result = await worker.recognize(canvas);
              lines.push(...String(result?.data?.text || "").split(/\r?\n/));
              canvas.width = 0;
              canvas.height = 0;
              setStatementProgress(35 + Math.round(((index + 1) / pages.length) * 65));
            }
          } finally {
            if (worker) { try { await worker.terminate(); } catch { /* Worker already stopped. */ } }
          }
        }

        const fullText = lines.join("\n");
        const fallbackAccount = accounts.find((item) => item.type === "bank")?.name || accounts[0]?.name || "Bank Account";
        const detectedCurrency = detectStatementCurrency(fullText, displayCurrencyCode);
        if (!exchangeRates[detectedCurrency]) {
          throw new Error(`The statement appears to use ${detectedCurrency}, but no exchange rate is currently available. Refresh rates or select a supported account currency before importing.`);
        }
        const parsed = parseStatementPdfLines(lines, detectedCurrency, fallbackAccount);
        valid = parsed.valid;
        errors = parsed.errors;
        if (!parsed.detectedRows) {
          throw new Error("No transaction rows could be identified in this PDF. If it is a scanned statement, ensure the text is clear. You can also export the statement as CSV and import that file.");
        }
        if (!valid.length) {
          setCsvImportFileName(file.name);
          setCsvImportRows([]);
          setCsvImportErrors(errors);
          setCsvImportResult("No rows were ready to import. Review the excluded rows or try exporting the bank statement as CSV.");
        }
      } else {
        const text = await file.text();
        const parsedRows = parseCsvText(text);
        if (parsedRows.length < 2) throw new Error("The CSV must contain a header row and at least one transaction row.");
        const headers = parsedRows[0].map((value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
        const findColumn = (...names) => headers.findIndex((header) => names.includes(header));
        const columns = {
          date: findColumn("date", "transactiondate", "transdate", "valuedate", "postingdate", "bookeddate"),
          title: findColumn("description", "title", "transaction", "name", "merchant", "narration", "particulars", "remarks", "transactiondetails"),
          amount: findColumn("amount", "value", "transactionamount", "netamount"),
          debit: findColumn("debit", "debitamount", "withdrawal", "withdrawals", "withdrawalamount", "dramount"),
          credit: findColumn("credit", "creditamount", "deposit", "deposits", "depositamount", "cramount"),
          type: findColumn("type", "transactiontype", "incomexpense", "drcr", "debitcredit"),
          category: findColumn("category", "expensecategory"),
          account: findColumn("account", "accountname", "paymentaccount", "paymentmethod", "wallet"),
          currency: findColumn("currency", "currencycode", "ccy"),
          note: findColumn("note", "notes", "memo", "remark", "remarks"),
        };
        const hasSplitColumns = columns.debit >= 0 || columns.credit >= 0;
        if ([columns.date, columns.title].some((index) => index < 0) || (columns.amount < 0 && !hasSplitColumns)) {
          throw new Error("Required CSV columns: Date, Description (or Narration/Particulars), and Amount OR Debit/Credit columns. Optional: Type, Category, Account, Currency, Notes.");
        }
        parsedRows.slice(1).forEach((values, rowIndex) => {
          const get = (column) => column >= 0 ? String(values[column] ?? "").trim() : "";
          const date = normalizeStatementDate(get(columns.date));
          const title = get(columns.title);
          const debit = Math.abs(parseStatementNumber(get(columns.debit)) || 0);
          const credit = Math.abs(parseStatementNumber(get(columns.credit)) || 0);
          const amountText = get(columns.amount);
          const signedAmount = amountText ? parseStatementNumber(amountText) : 0;
          const explicitType = get(columns.type).toLowerCase();
          let amount = Math.abs(signedAmount);
          let type = ["income", "credit", "cr", "deposit", "deposited"].includes(explicitType) ? "income"
            : ["expense", "debit", "dr", "withdrawal", "withdrawn"].includes(explicitType) ? "expense" : "expense";
          if (hasSplitColumns && (debit > 0 || credit > 0)) {
            if (debit > 0 && credit > 0) {
              errors.push({ row: rowIndex + 2, reason: "Both Debit and Credit contain amounts. Review this row manually." });
              return;
            }
            amount = credit > 0 ? credit : debit;
            type = credit > 0 ? "income" : "expense";
          } else if (amountText && !explicitType && signedAmount < 0) {
            type = "expense";
          }
          const category = get(columns.category) || "Other";
          const account = get(columns.account) || accounts.find((item) => item.type === "bank")?.name || accounts[0]?.name || "Bank Account";
          const matchedAccount = accounts.find((item) => String(item.name || "").trim().toLowerCase() === account.trim().toLowerCase());
          const currencyCode = (get(columns.currency) || matchedAccount?.currencyCode || displayCurrencyCode || "INR").toUpperCase();
          const note = get(columns.note);
          const reason = !date ? "Date could not be interpreted (use YYYY-MM-DD or DD/MM/YYYY)." : date > getDate() ? "Future-dated transactions are not allowed." : !title ? "Description is missing." : !Number.isFinite(amount) || amount <= 0 ? "Amount must be greater than zero." : !/^[A-Z]{3}$/.test(currencyCode) ? "Currency must be a three-letter ISO code." : !exchangeRates[currencyCode] ? `No exchange rate is available for ${currencyCode}.` : null;
          if (reason) errors.push({ row: rowIndex + 2, reason });
          else valid.push({ date, title: title.slice(0, 100), amount: Number(amount.toFixed(2)), type, category: category.slice(0, 60), account: account.slice(0, 80), currencyCode, note: note.slice(0, 500) });
        });
      }
      setCsvImportFileName(file.name);
      setCsvImportRows(valid);
      setCsvImportErrors(errors);
      if (valid.length) setCsvImportResult(`${valid.length} transaction(s) are ready for review. Nothing has been saved yet.`);
    } catch (error) {
      console.error("Statement parsing error:", error);
      alert(error.message || "Could not read this statement file.");
    } finally {
      setStatementParsing(false);
      setStatementProgress(0);
    }
  };

  const importCsvTransactions = async () => {
    if (!currentUser || !csvImportRows.length || csvImportBusy) return;
    setCsvImportBusy(true);
    try {
      const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
      const latestTransactionSnapshot = await getDocs(transactionsRef);
      const latestTransactions = latestTransactionSnapshot.docs.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }));
      const duplicateCheckTransactions = [...transactions, ...latestTransactions];
      const normalizeImportKey = (item) => [
        item.date,
        item.type,
        String(item.title || "").trim().toLowerCase(),
        Number(item.amount).toFixed(2),
        String(item.currencyCode || "INR").trim().toUpperCase(),
        String(item.account || "").trim().toLowerCase(),
      ].join("|");
      const importDocumentId = (item) => `import_${stableHash(normalizeImportKey(item))}_${stableHash(`finpilot:${normalizeImportKey(item)}`)}`;
      const existingKeys = new Set(duplicateCheckTransactions.map((item) => normalizeImportKey(item)));
      const existingImportIds = new Set(duplicateCheckTransactions
        .filter((item) => item.imported === true || String(item.id || "").startsWith("import_"))
        .map((item) => item.id));
      const inFileKeys = new Set();
      const rowsToImport = csvImportRows.filter((item) => {
        const key = normalizeImportKey(item);
        const stableId = importDocumentId(item);
        if (existingKeys.has(key) || inFileKeys.has(key) || existingImportIds.has(stableId)) return false;
        inFileKeys.add(key);
        return true;
      });
      if (!rowsToImport.length) {
        setCsvImportResult("No new records imported. Every valid row already exists or is duplicated in the file.");
        return;
      }
      const accountRef = collection(db, "users", currentUser.uid, "accounts");
      const categoriesRef = collection(db, "users", currentUser.uid, "categories");
      const latestAccountSnapshot = await getDocs(accountRef);
      const latestAccounts = latestAccountSnapshot.docs.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }));
      const accountLookup = new Map(latestAccounts.map((item) => [item.name.trim().toLowerCase(), item]));
      const missingAccountRows = new Map();
      rowsToImport.forEach((item) => {
        const key = item.account.trim().toLowerCase();
        if (!key || accountLookup.has(key)) return;
        const existing = missingAccountRows.get(key);
        if (!existing || item.date < existing.date) missingAccountRows.set(key, item);
      });

      // Importing a CSV can introduce bank/wallet names that do not exist yet.
      // Create them deterministically so imported transactions are linked to a ledger.
      for (const [accountNameKey, firstRow] of missingAccountRows.entries()) {
        const id = `csv_${stableHash(accountNameKey)}_${stableHash(`account:${accountNameKey}`)}`;
        const account = {
          id,
          name: firstRow.account.trim(),
          type: "other",
          currencyCode: firstRow.currencyCode || "INR",
          openingBalance: 0,
          openingBalanceDate: firstRow.date,
          isLegacy: true,
        };
        await setDoc(doc(accountRef, id), {
          name: account.name,
          type: account.type,
          currencyCode: account.currencyCode,
          openingBalance: 0,
          openingBalanceDate: account.openingBalanceDate,
          isLegacy: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        accountLookup.set(accountNameKey, account);
      }

      // Re-read categories as well, because the real-time listener may still be loading.
      const latestCategorySnapshot = await getDocs(categoriesRef);
      const latestCustomCategories = latestCategorySnapshot.docs.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id, custom: true }));
      const importKnownCategories = [...DEFAULT_CATEGORIES, ...latestCustomCategories];

      // Unknown imported categories become editable custom categories rather than
      // remaining invisible to the category filter and category manager.
      const categoriesToCreate = new Map();
      rowsToImport.forEach((item) => {
        const type = item.type === "income" ? "income" : "expense";
        const normalizedName = String(item.category).trim().toLowerCase();
        const categoryKey = `${type}:${normalizedName}`;
        const alreadyAvailable = importKnownCategories.some((category) =>
          String(category.name).trim().toLowerCase() === normalizedName
          && (category.type === type || category.type === "both")
        );
        if (!alreadyAvailable && !categoriesToCreate.has(categoryKey)) {
          categoriesToCreate.set(categoryKey, { name: item.category.trim(), type });
        }
      });
      for (const [categoryKey, category] of categoriesToCreate.entries()) {
        const id = `csv_${stableHash(categoryKey)}_${stableHash(`category:${categoryKey}`)}`;
        await setDoc(doc(categoriesRef, id), {
          name: category.name,
          type: category.type,
          icon: "○",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      const batchSize = 400;
      for (let start = 0; start < rowsToImport.length; start += batchSize) {
        const batch = writeBatch(db);
        rowsToImport.slice(start, start + batchSize).forEach((item) => {
          const account = accountLookup.get(item.account.trim().toLowerCase());
          const id = importDocumentId(item);
          batch.set(doc(transactionsRef, id), {
            ...item,
            accountId: account?.id || "",
            accountAmount: Number(convertCurrencyAmount(item.amount, item.currencyCode, account?.currencyCode || "INR").toFixed(2)),
            accountCurrencyCode: account?.currencyCode || "INR",
            imported: true,
            importedFrom: csvImportFileName,
            importedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        });
        await batch.commit();
      }
      setCsvImportResult(`Imported ${rowsToImport.length} transaction(s). Skipped ${csvImportRows.length - rowsToImport.length} duplicate row(s). ${csvImportErrors.length} invalid row(s) were excluded.`);
      setCsvImportRows([]);
      setCsvImportFileName("");
    } catch (error) {
      console.error("CSV import error:", error);
      alert("CSV import failed. Check your connection and Firestore rules, then try again.");
    } finally { setCsvImportBusy(false); }
  };

  const saveAdminSupportUpdate = async (request) => {
    if (!isSupportAdmin || !request?.ref || adminSavingRequestId) return;
    const reply = String(adminReplyDrafts[request.id] ?? request.adminReply ?? "").trim();
    const status = adminStatusDrafts[request.id] || (request.status === "Submitted" ? "Open" : request.status || "Open");
    if (reply.length > 3000) {
      setAdminSupportNotice({ type: "error", message: "Keep replies under 3,000 characters." });
      return;
    }
    setAdminSavingRequestId(request.id);
    setAdminSupportNotice(null);
    try {
      await updateDoc(request.ref, {
        status,
        adminReply: reply,
        repliedByEmail: currentUser.email || "",
        repliedAt: reply ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      setAdminSupportNotice({ type: "success", message: `Saved response and status for “${request.subject || "support request"}”. The customer will see the update in My Requests.` });
    } catch (error) {
      console.error("Admin support update error:", error);
      setAdminSupportNotice({ type: "error", message: "Could not save this response. Confirm that the administrator Firestore rules are published." });
    } finally {
      setAdminSavingRequestId("");
    }
  };

  const navGroups = NAV_GROUPS.map((group) => group.name === "Account & Help" && isSupportAdmin
    ? { ...group, items: [...group.items, { name: "Admin Support", icon: "✉" }] }
    : group);
  const pageDescription = {
    Dashboard: "Here's what's happening with your money.",
    Accounts: "Manage wallets, bank accounts, opening balances and transfers.",
    "Bank Sync Demo": "Explore a safe bank-connection and transaction-sync simulation using sample data.",
    Transactions: "Manage, search and review your transactions.",
    "Statement Import": "Import bank and wallet transaction history from CSV or PDF statements.",
    Achievements: "Track milestones and build consistent money habits.",
    Budgets: "Take control of your monthly spending.",
    Reports: "Understand your financial activity and compare months.",
    "Savings Goals": "Plan savings targets and track your contributions.",
    Insights: "See patterns and practical observations from your spending.",
    Recurring: "Manage scheduled income and expense transactions.",
    Reminders: "Keep track of upcoming and overdue bill payments.",
    "Financial Health": "Understand your financial habits with a transparent score.",
    Forecast: "Estimate month-end spending from your recent financial history.",
    "Split Expenses": "Divide shared purchases and track who has settled their share.",
    "Shared Budgets": "Collaborate on budgets and shared expense records with invited users.",
    Assistant: "Ask questions about your recorded FinPilot finances.",
    "Receipt Scanner": "Extract draft transaction details from receipt images on this device.",
    Categories: "Organise your income and expense categories.",
    Profile: "Manage your personal account information.",
    Settings: "Personalise how FinPilot looks and displays information.",
    "Support Centre": "Report an issue or send a message to the FinPilot team.",
    "Admin Support": "Review customer messages, reply and manage request status.",
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  if (authLoading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F8FC", color: "#7667E8", fontSize: 18, fontWeight: 700 }}>Loading FinPilot...</div>;
  }
  if (!currentUser) return <Auth />;

  return (
    <>
      <style>{`
${CSS_STYLES}
      `}</style>
      <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">F</div>
            <div className="brand-name">Fin<span>Pilot</span></div>
          </div>
          <div className="nav-label">WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            {navGroups.map((group) => {
              const expanded = Boolean(expandedNavGroups[group.name]);
              const isSingle = group.items.length === 1;
              if (isSingle) {
                const item = group.items[0];
                return (
                  <div className="nav-group nav-group-single" key={group.name}>
                    <button type="button" className={`nav-button ${activePage === item.name ? "active" : ""}`} onClick={() => navigateToPage(item.name)}>
                      <span className="nav-icon">{item.icon}</span><span>{item.name}</span>
                    </button>
                  </div>
                );
              }
              return (
                <div className="nav-group" key={group.name}>
                  <button
                    type="button"
                    className={`nav-group-toggle ${group.items.some((item) => item.name === activePage) ? "contains-active" : ""}`}
                    onClick={() => setExpandedNavGroups((previous) => ({ ...previous, [group.name]: !expanded }))}
                    aria-expanded={expanded}
                  >
                    <span className="nav-group-icon">{group.icon}</span>
                    <span className="nav-group-name">{group.name}</span>
                    <span className={`nav-group-chevron ${expanded ? "expanded" : ""}`} aria-hidden="true">⌄</span>
                  </button>
                  {expanded && (
                    <div className="nav-sublist">
                      {group.items.map((item) => (
                        <button key={item.name} type="button" className={`nav-button nav-sub-button ${activePage === item.name ? "active" : ""}`} onClick={() => navigateToPage(item.name)}>
                          <span className="nav-icon">{item.icon}</span><span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card">
              <strong>Your money, your control.</strong>
              <p>Small steps today can build a healthier financial future.</p>
              <button onClick={() => navigateToPage("Reports")}>View financial reports →</button>
            </div>
            <div className="profile">
              <div className="avatar">{profilePhotoData ? <img src={profilePhotoData} alt="" /> : (profileName || currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <strong>{profileName || currentUser.displayName || "FinPilot User"}</strong>
                <small>{currentUser.email || "Personal Account"}</small>
              </div>
              <div className="profile-logout-zone">
                <button type="button" className="profile-more-trigger" aria-label="Show account actions" title="Account actions">⋯</button>
                <button type="button" className="logout-button" onClick={handleLogout} title="Log out of FinPilot">↪ Logout</button>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <h1>{activePage}</h1>
              <p>{pageDescription[activePage]} &nbsp;·&nbsp; {currentMonth}</p>
            </div>
            <div className="top-actions">
              <div className="search-box">
                <span>⌕</span>
                <input placeholder="Search transactions..." value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") navigateToPage("Transactions"); }} />
              </div>
              <button className="primary-button" onClick={openAddModal}>＋ Add Transaction</button>
            </div>
          </header>
          <div className={`connection-banner ${isOnline ? "online" : "offline"}`} role="status">
            <span className="connection-dot" />
            {isOnline ? "Online · your records are syncing with Firebase." : "Offline mode · showing cached records. Changes will sync when you reconnect."}
          </div>

          {activePage === "Dashboard" && (
            <>
              <div className="stats-grid">
                <StatCard label="Total Account Balance" value={displayMoney(balance)} icon="◈" iconBg="#EFEDFF" color="#7667E8" foot="Opening balances + income − expenses + transfers" />
                <StatCard label="Total Income" value={displayMoney(income)} icon="↗" iconBg="#E9F8F2" color="#36A891" foot="This month" />
                <StatCard label="Total Expenses" value={displayMoney(expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot="This month" />
                <StatCard label="Net Savings" value={displayMoney(savings)} icon="◌" iconBg="#FFF5E9" color="#E9A34B" foot={`${savingsRate.toFixed(1)}% savings rate`} />
              </div>
              <div className="content-grid">
                <section className="panel">
                  <div className="section-heading"><div><h2>Financial Overview</h2><p>Your income and expenses this month</p></div><span className="muted" style={{ fontSize: 10 }}>Monthly</span></div>
                  <div className="bar-chart">
                    {weeklyOverview.map((week) => (
                      <div className="bar-group" key={week.label}>
                        <div className="bar-pair">
                          <div className="bar income-bar" title={`Income: ${displayMoney(week.income)}`} style={{ height: `${(week.income / maxWeeklyAmount) * 100}%` }} />
                          <div className="bar expense-bar" title={`Expenses: ${displayMoney(week.expense)}`} style={{ height: `${(week.expense / maxWeeklyAmount) * 100}%` }} />
                        </div>
                        <span className="bar-label">{week.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend"><span className="legend-item"><i className="legend-dot" style={{ background: "#10B981" }} /> Income</span><span className="legend-item"><i className="legend-dot" style={{ background: "#F97373" }} /> Expenses</span></div>
                </section>
                <section className="panel">
                  <div className="section-heading"><div><h2>Spending by Category</h2><p>Where your money goes</p></div></div>
                  {categoryTotals.length ? <div className="category-list">{categoryTotals.slice(0, 5).map((item, index) => (
                    <div key={item.name}>
                      <div className="category-row"><div className="category-icon" style={{ color: COLORS[index % COLORS.length], background: `${COLORS[index % COLORS.length]}18` }}>{getCategoryIcon(item.name)}</div><div><span className="category-name">{item.name}</span><span className="category-meta">{((item.amount / (expenses || 1)) * 100).toFixed(1)}% of expenses</span></div><span className="category-amount">{displayMoney(item.amount)}</span></div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${expenses ? item.amount / expenses * 100 : 0}%`, background: COLORS[index % COLORS.length] }} /></div>
                    </div>
                  ))}</div> : <div className="empty-state">No expense data yet.</div>}
                </section>
              </div>
              <div className="bottom-grid">
                <section className="panel">
                  <div className="section-heading"><div><h2>Recent Transactions</h2><p>Your latest financial activities</p></div><button className="text-link" onClick={() => navigateToPage("Transactions")}>View all →</button></div>
                  <div className="transaction-list">
                    {transactions.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5).map((item) => (
                      <div className="transaction-row" key={item.id}>
                        <div className="category-icon">{getCategoryIcon(item.category)}</div>
                        <div><span className="transaction-title" title={item.note || ""}>{item.title}</span><span className="transaction-subtitle">{item.category} · {item.account}{item.note ? " · Note added" : ""}</span></div>
                        <span className={`transaction-amount ${item.type === "income" ? "positive" : ""}`}>{item.type === "income" ? "+" : "-"}{transactionMoney(item)}</span>
                        <span className="transaction-date">{formatDate(item.date, dateFormat)}</span>
                      </div>
                    ))}
                    {!transactions.length && <div className="empty-state">No transactions yet. Add your first transaction!</div>}
                  </div>
                </section>
                <section className="panel">
                  <div className="section-heading"><div><h2>Top Expenses</h2><p>Your five largest expenses this month</p></div><button className="text-link" onClick={() => navigateToPage("Transactions")}>Details →</button></div>
                  <div className="transaction-list">
                    {topExpenses.map((item, index) => (
                      <div className="transaction-row" key={item.id}><div className="top-expense-rank">{index + 1}</div><div><span className="transaction-title">{item.title}</span><span className="transaction-subtitle">{item.category}</span></div><span className="transaction-amount">{transactionMoney(item)}</span><span className="transaction-date">{formatDate(item.date, dateFormat)}</span></div>
                    ))}
                    {!topExpenses.length && <div className="empty-state">No expenses this month.</div>}
                  </div>
                </section>
              </div>
              {billReminders.some((item) => item.paid !== true && item.dueDate <= toLocalDateInput(new Date(Date.now() + 7 * 86400000))) && <section className="panel" style={{ marginTop: 19 }}><div className="section-heading"><div><h2>Upcoming Bill Reminders</h2><p>Unpaid bills due within the next seven days or overdue.</p></div><button type="button" className="text-link" onClick={() => navigateToPage("Reminders")}>View reminders →</button></div>{billReminders.filter((item) => item.paid !== true && item.dueDate <= toLocalDateInput(new Date(Date.now() + 7 * 86400000))).slice(0, 4).map((item) => <div className="transaction-row" key={item.id}><div className="category-icon">◷</div><div><span className="transaction-title">{item.title}</span><span className="transaction-subtitle">{item.dueDate < getDate() ? "Overdue" : item.dueDate === getDate() ? "Due today" : "Upcoming"}</span></div><strong className="transaction-amount">{recordMoney(item.amount, item.currencyCode || "INR")}</strong><span className="transaction-date">{formatDate(item.dueDate, dateFormat)}</span></div>)}</section>}
              <section className="panel" style={{ marginTop: 19 }}>
                <div className="section-heading"><div><h2>Monthly Budget</h2><p>Track your spending limit</p></div><button className="secondary-button" onClick={openBudgetEditor}>Edit Budget</button></div>
                <div className="budget-total">{displayMoney(expenses)} <span style={{ fontSize: 12, color: "#A1A4B2", fontWeight: 500 }}>of {displayMoney(budgetInInr)}</span></div>
                <div className="budget-track"><div className="budget-fill" style={{ width: `${Math.min(budgetUsed, 100)}%` }} /></div>
                <div className="budget-meta"><span>{budgetUsed.toFixed(1)}% used</span><span>{displayMoney(Math.max(0, budgetInInr - expenses))} remaining</span></div>
              </section>
            </>
          )}

          {activePage === "Accounts" && (
            <>
              <div className="section-heading"><div><h2>Accounts & Wallets</h2><p>Opening balances, transactions and transfers determine each account's running balance.</p></div><div className="filter-actions"><button type="button" className="secondary-button" onClick={openTransferModal} disabled={accounts.length < 2}>⇄ Transfer Money</button><button type="button" className="primary-button" onClick={openAddAccount}>＋ Add Account</button></div></div>
              <div className="stats-grid">
                <StatCard label="Total Account Balance" value={displayMoney(totalAccountBalanceInInr)} icon="▣" iconBg="#EFEDFF" color="#7667E8" foot="Opening balances + activity + transfers" />
                <StatCard label="Accounts & Wallets" value={accounts.length} icon="◫" iconBg="#E9F8F2" color="#36A891" foot="Across all account types" />
                <StatCard label="Transfers Recorded" value={transfers.length} icon="⇄" iconBg="#FFF5E9" color="#E9A34B" foot="Transfers are not income or expenses" />
                <StatCard label="Ledger Transactions" value={transactions.length} icon="↕" iconBg="#FCEEF2" color="#D96A7C" foot="Linked to account history" />
              </div>
              {accountsLoading ? <section className="panel"><div className="empty-state">Loading your accounts…</div></section> : accounts.length ? <div className="account-grid">{accounts.map((account) => {
                const accountBalance = getAccountBalance(account);
                const isLiability = account.type === "card";
                return <section className="account-card" key={account.id}>
                  <div className="account-card-top"><div className="account-type-icon">{account.type === "cash" ? "◉" : account.type === "card" ? "▤" : account.type === "upi" ? "↗" : account.type === "wallet" ? "◇" : "▣"}</div><div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}><span className="status-pill">{String(account.type || "other").replace(/^./, (value) => value.toUpperCase())}</span>{account.isDemo && <span className="status-pill warning">DEMO</span>}</div></div>
                  <h3>{account.name}</h3><p className="account-currency-label">{account.currencyCode || "INR"} · Opening balance {money(account.openingBalance || 0, account.currencyCode || "INR", 1)}</p>
                  <div className="account-balance">{money(accountBalance, account.currencyCode || "INR", 1)}</div><small className="account-balance-caption">{accountBalance < 0 ? (isLiability ? "Outstanding balance / amount due" : "Net account position") : "Current account balance"}</small>
                  <div className="feature-card-actions"><button type="button" className="secondary-button" onClick={() => openEditAccount(account)}>Edit</button><button type="button" className="action-button" onClick={() => deleteAccount(account)}>Delete</button></div>
                </section>;
              })}</div> : <section className="panel"><div className="empty-state">No accounts yet. Add a bank account, cash wallet, UPI account or card to begin.</div></section>}
              <section className="panel" style={{ marginTop: 18 }}><div className="section-heading"><div><h2>Transfer History</h2><p>Internal transfers move value between accounts without changing income or expenses.</p></div></div>{transfers.length ? <div className="transaction-list">{transfers.map((item) => <div className="transaction-row" key={item.id}><div className="category-icon">⇄</div><div><span className="transaction-title">{item.fromAccountName} → {item.toAccountName}</span><span className="transaction-subtitle">{formatDate(item.date, dateFormat)}{item.note ? ` · ${item.note}` : ""}</span></div><strong className="transaction-amount">{money(item.fromAmount, item.fromCurrencyCode || "INR", 1)} → {money(item.toAmount, item.toCurrencyCode || "INR", 1)}</strong><button type="button" className="action-button" title="Delete transfer" onClick={async()=>{if(window.confirm("Delete this transfer? Both account balances will be recalculated.")){try{await deleteDoc(doc(db,"users",currentUser.uid,"transfers",item.id));}catch(error){console.error(error);alert("Unable to delete this transfer.");}}}}>✕</button></div>)}</div> : <div className="empty-state">No transfers recorded yet.</div>}</section>
              <p className="feature-page-intro" style={{ marginTop: 12 }}>Existing transaction labels are mapped to zero-opening-balance accounts. Set each real opening balance and the date it applies to calculate accurate balances. Older transactions before that date are historical and are not added to the opening snapshot.</p>
            </>
          )}

          {activePage === "Bank Sync Demo" && (
            <>
              <div className="section-heading">
                <div><h2>Bank Sync Demo</h2><p>Demonstrate bank connection, customer consent and transaction synchronisation with sample data.</p></div>
                <span className="status-pill warning">SIMULATION ONLY</span>
              </div>
              <div className="bank-demo-notice">
                <strong>This is not a real bank connection.</strong> FinPilot will not contact a bank, Account Aggregator or payment network. Never enter bank passwords, card PINs or OTPs here. Connecting and syncing below uses fictional sample data and clearly marked demo records in your FinPilot account.
              </div>
              <section className="panel" style={{marginBottom:16}}>
                <div className="section-heading"><div><h2>Demo consent</h2><p>Consent is simulated for this project demonstration.</p></div><span className="status-pill">No external API</span></div>
                <label className="bank-demo-consent">
                  <input type="checkbox" checked={bankDemoConsentAccepted} onChange={(event)=>setBankDemoConsentAccepted(event.target.checked)} />
                  <span>I understand that these are fictional sample banks and sample transactions. No real financial information will be accessed. Imported demo records will be labelled DEMO and can be removed from this page.</span>
                </label>
              </section>
              <div className="bank-demo-grid">
                {DEMO_BANK_PROVIDERS.map((bank)=>{
                  const connection = bankSyncDemoConnections.find((item)=>item.id===bank.id);
                  const connected = connection?.status === "connected";
                  const account = accounts.find((item)=>item.id===`demo_account_${bank.id}`);
                  const lastSync = connection?.lastSyncAt?.toDate ? connection.lastSyncAt.toDate().toLocaleString() : "Not synced yet";
                  return (
                    <article className="bank-demo-card" key={bank.id}>
                      <div className="bank-demo-top"><div className="bank-demo-icon">{bank.shortName}</div><span className={`status-pill ${connected?"success":""}`}>{connected?"Connected (Demo)":"Not connected"}</span></div>
                      <h3>{bank.name}</h3>
                      <p>{bank.description}</p>
                      <div className="bank-demo-meta">Sample opening balance: {money(bank.openingBalance,"INR",1)}<br/>Sample records available: {bank.transactions.length}<br/>Last sync: {lastSync}</div>
                      {account && <div className="bank-demo-meta">Demo account balance: <strong>{money(getAccountBalance(account),account.currencyCode||"INR",1)}</strong></div>}
                      <div className="bank-demo-actions">
                        {!connected ? <button type="button" className="primary-button" disabled={!bankDemoConsentAccepted||bankDemoBusyId===bank.id} onClick={()=>connectDemoBank(bank)}>{bankDemoBusyId===bank.id?"Connecting…":"Connect Demo Bank"}</button> : <>
                          <button type="button" className="primary-button" disabled={bankDemoBusyId===bank.id} onClick={()=>syncDemoBank(bank)}>{bankDemoBusyId===bank.id?"Syncing…":"↻ Sync Sample Data"}</button>
                          <button type="button" className="secondary-button" disabled={bankDemoBusyId===bank.id} onClick={()=>disconnectDemoBank(bank)}>Disconnect</button>
                        </>}
                        {(connection || account) && <button type="button" className="action-button" disabled={bankDemoBusyId===bank.id} onClick={()=>removeDemoBankData(bank)}>Remove Demo Data</button>}
                      </div>
                    </article>
                  );
                })}
              </div>
              {bankDemoMessage && <div className="bank-demo-success" role="status">{bankDemoMessage}</div>}
              <section className="panel" style={{marginTop:17}}>
                <div className="section-heading"><div><h2>How this demonstration works</h2><p>Sample data is added only after you explicitly connect and sync a demo provider.</p></div></div>
                <div className="feature-grid">
                  <div className="feature-card"><h3>1. Connect</h3><p>Accept the demo consent and connect one of the fictional sample banks. The connection record is saved under your own FinPilot user profile.</p></div>
                  <div className="feature-card"><h3>2. Sync</h3><p>FinPilot creates a clearly labelled demo account and imports the provider's sample transactions into your accounts and transaction history.</p></div>
                  <div className="feature-card"><h3>3. Prevent duplicates</h3><p>Each sample bank transaction has a stable ID. Running Sync again imports only missing sample rows.</p></div>
                  <div className="feature-card"><h3>4. Remove</h3><p>Use Remove Demo Data to delete only that provider's tagged sample transactions and its demo account when safe to do so.</p></div>
                </div>
                <p className="feature-page-intro" style={{marginTop:14}}>All sample amounts are in INR. They appear in Dashboard, Accounts, Transactions, Reports and Insights like other recorded transactions, but their notes and source fields identify them as demo data. This feature is for a zero-budget classroom demonstration and is not an operational bank-sync service.</p>
              </section>
            </>
          )}

          {activePage === "Transactions" && (
            <section className="panel">
              <div className="section-heading">
                <div><h2>All Transactions</h2><p>{filteredTransactions.length} transaction(s) found</p></div>
                <div className="filter-actions"><button className="secondary-button" onClick={() => navigateToPage("Statement Import")}>↑ Import Statement</button><button className="secondary-button" onClick={exportCSV}>↓ Export CSV</button><button className="secondary-button" onClick={exportPDF}>↓ Export PDF</button><button className="primary-button" onClick={openAddModal}>＋ Add New</button></div>
              </div>
              <div className="filters">
                <select className="filter-control" value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="all">All Types</option><option value="income">Income</option><option value="expense">Expenses</option></select>
                <select className="filter-control" value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}><option value="all">All Categories</option>{categoryNames.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                <select className="filter-control" value={filterAccount} onChange={(event) => setFilterAccount(event.target.value)}><option value="all">All Accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
                <select className="filter-control" value={filterCurrency} onChange={(event) => setFilterCurrency(event.target.value)}><option value="all">All Currencies</option>{currencyOptions.map((code) => <option key={code} value={code}>{code}</option>)}</select>
                <label className="date-filter">Min amount ({displayCurrencyCode})<input className="filter-control" type="number" min="0" step="0.01" value={filterMinAmount} onChange={(event) => setFilterMinAmount(event.target.value)} placeholder="No minimum" /></label>
                <label className="date-filter">Max amount ({displayCurrencyCode})<input className="filter-control" type="number" min="0" step="0.01" value={filterMaxAmount} onChange={(event) => setFilterMaxAmount(event.target.value)} placeholder="No maximum" /></label>
                <label className="date-filter">From date<input className="filter-control" type="date" value={filterStartDate} max={filterEndDate || undefined} onChange={(event) => setFilterStartDate(event.target.value)} /></label>
                <label className="date-filter">To date<input className="filter-control" type="date" value={filterEndDate} min={filterStartDate || undefined} onChange={(event) => setFilterEndDate(event.target.value)} /></label>
                <button className="secondary-button" onClick={clearFilters}>Clear Filters</button>
              </div>
              <div className="table-wrap">
                <table className="transaction-table">
                  <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Account</th><th>Type</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>{filteredTransactions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td><td>{item.category}</td><td>{formatDate(item.date, dateFormat)}</td><td>{item.account}</td>
                      <td><span className={`type-pill ${item.type === "income" ? "income-pill" : "expense-pill"}`}>{item.type}</span></td>
                      <td style={{ fontWeight: 800, color: item.type === "income" ? "#36A891" : "#E47D8D" }}>{transactionMoney(item)}</td>
                      <td title={item.note || "No note"}>{item.note ? <span className="note-preview">{item.note}</span> : <span className="muted">—</span>}</td>
                      <td><button className="action-button" title="Edit" onClick={() => openEditModal(item)}>✎</button><button className="action-button" title="Delete" onClick={() => deleteTransaction(item.id)}>✕</button></td>
                    </tr>
                  ))}</tbody>
                </table>
                {!filteredTransactions.length && <div className="empty-state">No matching transactions found.</div>}
              </div>
            </section>
          )}

          {activePage === "Budgets" && (
            <>
              <section className="panel" style={{ marginBottom: 18 }}>
                <div className="section-heading"><div><h2>Monthly Spending Budget</h2><p>Your overall monthly spending limit</p></div><button className="secondary-button" onClick={openBudgetEditor}>Edit Budget</button></div>
                <div className="budget-total">{displayMoney(expenses)}</div><div className="budget-caption">Spent from {displayMoney(budgetInInr)}</div>
                <div className="budget-track"><div className="budget-fill" style={{ width: `${Math.min(budgetUsed, 100)}%` }} /></div>
                <div className="budget-meta"><span>{budgetUsed.toFixed(1)}% utilized</span><span>{displayMoney(Math.max(0, budgetInInr - expenses))} remaining</span></div>
                {expenses > budgetInInr && <p className="negative" style={{ fontSize: 13, fontWeight: 700 }}>You have exceeded your monthly budget by {displayMoney(expenses - budgetInInr)}.</p>}
              </section>
              <section className="panel" style={{ marginBottom: 18 }}>
                <div className="section-heading"><div><h2>Category-wise Budgets</h2><p>Set individual limits in your current preferred currency. Each saved budget keeps its own currency.</p></div></div>
                <div className="feature-grid">
                  {expenseCategories.map((category) => {
                    const spent = categorySpend(category.name);
                    const limit = categoryBudgetByName[category.name] || 0;
                    const used = limit > 0 ? (spent / limit) * 100 : 0;
                    return (
                      <div className="feature-card" key={category.name}>
                        <div className="feature-card-top"><div><h3>{category.name}</h3><p>{displayMoney(spent)} spent this month</p></div><span className={`status-pill ${limit > 0 && spent > limit ? "danger" : limit > 0 && used >= 80 ? "warning" : "success"}`}>{limit > 0 ? `${used.toFixed(0)}% used` : "No limit"}</span></div>
                        {limit > 0 && <><div className="goal-progress"><span style={{ width: `${Math.min(used, 100)}%`, background: used > 100 ? "#E47D8D" : undefined }} /></div><div className="budget-meta"><span>{displayMoney(Math.max(0, limit - spent))} remaining</span><span>Limit {displayMoney(limit)}</span></div></>}
                        <div className="inline-budget-form"><MoneyInput compact id={`category-budget-${category.name.replace(/[^a-z0-9]/gi, "-")}`} ariaLabel={`${category.name} monthly budget`} currencyCode={displayCurrencyCode} value={categoryBudgetDrafts[category.name] ?? (limit ? inrToDisplayAmount(limit).toFixed(2) : "100")} onChange={(value) => setCategoryBudgetDrafts((old) => ({ ...old, [category.name]: value }))} /><button type="button" className="secondary-button" disabled={categoryBudgetSaving === category.name} onClick={() => saveCategoryBudget(category.name)}>{categoryBudgetSaving === category.name ? "Saving..." : limit ? "Update" : "Set limit"}</button></div>
                        {limit > 0 && <div className="feature-card-actions"><button type="button" className="text-link" onClick={() => removeCategoryBudget(category.name)}>Remove limit</button></div>}
                      </div>
                    );
                  })}
                </div>
              </section>
              <div className="section-heading"><div><h2>Category Breakdown</h2><p>Monthly expenses by category</p></div></div>
              <div className="budget-page-grid">{categoryTotals.map((item, index) => (
                <div className="budget-category-card" key={item.name}><div className="category-row"><div className="category-icon">{getCategoryIcon(item.name)}</div><div><span className="category-name">{item.name}</span><span className="category-meta">Spent this month</span></div><strong className="category-amount">{displayMoney(item.amount)}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${expenses ? item.amount / expenses * 100 : 0}%`, background: COLORS[index % COLORS.length] }} /></div></div>
              ))}</div>
            </>
          )}

          {activePage === "Reports" && (
            <>
              <div className="stats-grid"><StatCard label="Monthly Income" value={displayMoney(income)} icon="↗" iconBg="#E9F8F2" color="#36A891" foot="Current month" /><StatCard label="Monthly Expenses" value={displayMoney(expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot="Current month" /><StatCard label="Net Savings" value={displayMoney(savings)} icon="◈" iconBg="#EFEDFF" color="#7667E8" foot="Income minus expenses" /><StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon="◌" iconBg="#FFF5E9" color="#E9A34B" foot="Of monthly income" /></div>
              <div className="content-grid">
                <section className="panel"><div className="section-heading"><div><h2>Expense Breakdown</h2><p>Category-wise spending this month</p></div></div>
                  {categoryTotals.length ? categoryTotals.map((item, index) => <div style={{ marginBottom: 19 }} key={item.name}><div className="budget-meta"><strong style={{ color: "#45495D" }}>{item.name}</strong><strong>{displayMoney(item.amount)}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${expenses ? item.amount / expenses * 100 : 0}%`, background: COLORS[index % COLORS.length] }} /></div></div>) : <div className="empty-state">Add expenses to see your report.</div>}
                </section>
                <section className="panel"><div className="section-heading"><div><h2>Spending Summary</h2><p>Current month</p></div></div>
                  <div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(${categoryTotals.map((item, index) => `${COLORS[index % COLORS.length]} ${categoryTotals.slice(0, index).reduce((sum, value) => sum + (expenses ? value.amount / expenses * 100 : 0), 0)}% ${categoryTotals.slice(0, index + 1).reduce((sum, value) => sum + (expenses ? value.amount / expenses * 100 : 0), 0)}%`).join(", ") || "#ECECF4 0% 100%"})` }}><div className="donut-hole"><div><strong>{displayMoney(expenses)}</strong><span>Total spent</span></div></div></div></div>
                  <div className="budget-meta"><span>Transactions</span><strong>{monthTransactions.length}</strong></div><div className="budget-meta" style={{ marginTop: 12 }}><span>Budget remaining</span><strong>{displayMoney(Math.max(0, budgetInInr - expenses))}</strong></div>
                </section>
              </div>
              <section className="panel"><div className="section-heading"><div><h2>Top Expenses</h2><p>Highest individual expenses this month</p></div></div>
                {topExpenses.map((item, index) => <div className="transaction-row" key={item.id}><div className="top-expense-rank">{index + 1}</div><div><span className="transaction-title">{item.title}</span><span className="transaction-subtitle">{item.category}</span></div><span className="transaction-amount">{transactionMoney(item)}</span><span className="transaction-date">{formatDate(item.date, dateFormat)}</span></div>)}
                {!topExpenses.length && <div className="empty-state">No expenses available.</div>}
              </section>
              <section className="panel" style={{ marginTop: 18 }}>
                <div className="section-heading"><div><h2>Monthly Comparison</h2><p>Compare a selected month with the month immediately before it.</p></div><select className="filter-control" value={selectedComparisonMonth} onChange={(event) => setSelectedComparisonMonth(event.target.value)}>{comparisonMonthOptions.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}</select></div>
                <p className="feature-page-intro">{selectedComparisonMonth === monthKey ? "The selected month is still in progress; its totals are month-to-date." : "The selected month is compared with the previous calendar month."}</p>
                <div className="stats-grid">
                  <StatCard label="Selected Month Income" value={displayMoney(comparisonCurrentSummary.income)} icon="↗" iconBg="#E9F8F2" color="#36A891" foot={monthLabel(selectedComparisonMonth)} />
                  <StatCard label="Previous Month Income" value={displayMoney(comparisonPreviousSummary.income)} icon="↗" iconBg="#E9F8F2" color="#36A891" foot={monthLabel(comparisonPreviousMonth)} />
                  <StatCard label="Selected Month Expenses" value={displayMoney(comparisonCurrentSummary.expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot={monthLabel(selectedComparisonMonth)} />
                  <StatCard label="Previous Month Expenses" value={displayMoney(comparisonPreviousSummary.expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot={monthLabel(comparisonPreviousMonth)} />
                </div>
                <div className="table-wrap"><table className="comparison-table"><thead><tr><th>Metric</th><th>{monthLabel(selectedComparisonMonth)}</th><th>{monthLabel(comparisonPreviousMonth)}</th><th>Difference</th></tr></thead><tbody>
                  {[{ label: "Income", current: comparisonCurrentSummary.income, previous: comparisonPreviousSummary.income }, { label: "Expenses", current: comparisonCurrentSummary.expenses, previous: comparisonPreviousSummary.expenses }, { label: "Net savings", current: comparisonCurrentSummary.savings, previous: comparisonPreviousSummary.savings }].map((row) => <tr key={row.label}><td><strong>{row.label}</strong></td><td>{displayMoney(row.current)}</td><td>{displayMoney(row.previous)}</td><td className={row.label === "Expenses" ? (row.current <= row.previous ? "positive" : "negative") : (row.current >= row.previous ? "positive" : "negative")}>{row.current - row.previous >= 0 ? "+" : "−"}{displayMoney(Math.abs(row.current - row.previous))}</td></tr>)}
                </tbody></table></div>
              </section>
            </>
          )}

          {activePage === "Savings Goals" && (
            <>
              <div className="section-heading"><div><h2>Your Savings Goals</h2><p>Track progress toward the things you are saving for.</p></div><button type="button" className="primary-button" onClick={openAddGoal}>＋ Create Goal</button></div>
              <div className="stats-grid"><StatCard label="Active Goals" value={savingsGoals.length} icon="◎" iconBg="#EFEDFF" color="#7667E8" foot="Your personal targets" /><StatCard label="Total Target" value={displayMoney(savingsGoals.reduce((sum, item) => sum + goalTargetAmountInInr(item), 0))} icon="◈" iconBg="#E9F8F2" color="#36A891" foot="Across all goals" /><StatCard label="Amount Saved" value={displayMoney(savingsGoals.reduce((sum, item) => sum + goalSavedAmountInInr(item), 0))} icon="↗" iconBg="#FFF5E9" color="#E9A34B" foot="Contributions recorded" /><StatCard label="Remaining Target" value={displayMoney(savingsGoals.reduce((sum, item) => sum + Math.max(0, goalTargetAmountInInr(item) - goalSavedAmountInInr(item)), 0))} icon="⌛" iconBg="#FFF0F1" color="#E47D8D" foot="Still to save" /></div>
              {savingsGoals.length ? <div className="feature-grid">{savingsGoals.map((goal) => { const target = goalTargetAmountInInr(goal); const saved = goalSavedAmountInInr(goal); const progress = target > 0 ? saved / target * 100 : 0; const completed = progress >= 100; return <section className="feature-card" key={goal.id}><div className="feature-card-top"><div><h3>{goal.name}</h3><p>{goal.description || "Personal savings target"}</p></div><span className={`status-pill ${completed ? "success" : ""}`}>{completed ? "Completed" : `${Math.min(progress, 100).toFixed(0)}%`}</span></div><div className="budget-total" style={{ fontSize: 22 }}>{displayMoney(saved)} <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>of {displayMoney(target)}</span></div><div className="goal-progress"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div><div className="budget-meta"><span>{displayMoney(Math.max(0, target - saved))} to go</span><span>Target: {formatDate(goal.deadline, dateFormat)}</span></div><div className="feature-card-actions"><button type="button" className="primary-button" onClick={() => openContribution(goal)}>＋ Add Contribution</button><button type="button" className="secondary-button" onClick={() => openEditGoal(goal)}>Edit</button><button type="button" className="action-button" onClick={() => deleteGoal(goal)} title="Delete goal">✕</button></div></section>; })}</div> : <section className="panel"><div className="empty-state">You have not created a savings goal yet. Create your first goal to start tracking progress.</div></section>}
            </>
          )}

          {activePage === "Insights" && (
            <>
              <div className="section-heading"><div><h2>Your Spending Insights</h2><p>Observations calculated from your recorded transactions and budgets.</p></div><span className="status-pill">{currentMonth}</span></div>
              <div className="stats-grid"><StatCard label="This Month's Expenses" value={displayMoney(expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot="Current month" /><StatCard label="Previous Month Expenses" value={displayMoney(previousMonthSummary.expenses)} icon="◷" iconBg="#EFEDFF" color="#7667E8" foot={monthLabel(previousMonthKey)} /><StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon="◈" iconBg="#E9F8F2" color="#36A891" foot="Income minus expenses" /><StatCard label="Categories Over Limit" value={categoryBudgets.filter((item) => categorySpend(item.categoryName) > (categoryBudgetByName[item.categoryName] || 0)).length} icon="!" iconBg="#FFF5E9" color="#E9A34B" foot="Configured category budgets" /></div>
              <section className="panel"><div className="section-heading"><div><h2>Personalised observations</h2><p>These are descriptive insights, not financial advice.</p></div></div><div className="insight-list">{spendingInsights.map((item, index) => <div className="insight-item" key={`${item.title}-${index}`}><div className="insight-icon">{item.icon}</div><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}</div></section>
              {categoryBudgets.length > 0 && <section className="panel" style={{ marginTop: 18 }}><div className="section-heading"><div><h2>Category budget status</h2><p>Current-month expenses versus your limits.</p></div><button type="button" className="text-link" onClick={() => navigateToPage("Budgets")}>Manage budgets →</button></div>{categoryBudgets.map((item) => { const spent = categorySpend(item.categoryName); const limit = categoryBudgetByName[item.categoryName] || 0; const percent = limit > 0 ? spent / limit * 100 : 0; return <div style={{ marginBottom: 16 }} key={item.id}><div className="budget-meta"><strong>{item.categoryName}</strong><span>{displayMoney(spent)} / {displayMoney(limit)}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: percent > 100 ? "#E47D8D" : undefined }} /></div></div>; })}</section>}
            </>
          )}

          {activePage === "Recurring" && (
            <>
              <div className="section-heading"><div><h2>Recurring Transactions</h2><p>Scheduled entries are automatically recorded when their due date arrives while FinPilot is open.</p></div><button type="button" className="primary-button" onClick={openAddRecurring}>＋ Add Schedule</button></div>
              <p className="feature-page-intro">When you sign in or open FinPilot, due occurrences are added once to your transaction history. Previously recorded entries are not duplicated.</p>
              {recurringTransactions.length ? <div className="feature-grid">{recurringTransactions.map((item) => <section className="feature-card" key={item.id}><div className="feature-card-top"><div><h3>{item.title}</h3><p>{item.type === "income" ? "Income" : "Expense"} · {item.category} · {item.account}</p></div><span className={`status-pill ${item.active === false ? "warning" : "success"}`}>{item.active === false ? "Paused" : "Active"}</span></div><div className="budget-total" style={{ fontSize: 22 }}>{transactionMoney(item)}</div><div className="feature-card-meta"><span>Frequency: {item.frequency}</span><span>Next due: {formatDate(item.nextDueDate, dateFormat)}</span></div><div className="feature-card-actions"><button type="button" className="secondary-button" onClick={() => toggleRecurring(item)}>{item.active === false ? "Resume" : "Pause"}</button><button type="button" className="secondary-button" onClick={() => openEditRecurring(item)}>Edit</button><button type="button" className="action-button" onClick={() => deleteRecurring(item)} title="Delete schedule">✕</button></div></section>)}</div> : <section className="panel"><div className="empty-state">No recurring schedules yet. Add a salary, rent, subscription or regular bill.</div></section>}
            </>
          )}

          {activePage === "Reminders" && (
            <>
              <div className="section-heading"><div><h2>Bill Reminders</h2><p>Keep upcoming payments visible and mark bills as paid.</p></div><div className="feature-card-actions"><button type="button" className="secondary-button" onClick={requestBrowserNotifications} disabled={notificationPermission==="granted"||notificationPermission==="unsupported"}>{notificationPermission==="granted"?"Browser alerts enabled":notificationPermission==="unsupported"?"Notifications unsupported":"Enable browser alerts"}</button><button type="button" className="primary-button" onClick={openAddBillReminder}>＋ Add Reminder</button></div></div><p className="feature-page-intro">Browser alerts appear while FinPilot is open and permission is granted. Background notifications while the browser is closed require Firebase Cloud Messaging and a server-side scheduler.</p>
              <div className="stats-grid"><StatCard label="Overdue" value={billReminders.filter((item) => item.paid !== true && item.dueDate < getDate()).length} icon="!" iconBg="#FFF0F1" color="#E47D8D" foot="Unpaid past due date" /><StatCard label="Due Today" value={billReminders.filter((item) => item.paid !== true && item.dueDate === getDate()).length} icon="◷" iconBg="#FFF5E9" color="#E9A34B" foot="Needs attention today" /><StatCard label="Due in 7 Days" value={billReminders.filter((item) => item.paid !== true && item.dueDate > getDate() && item.dueDate <= toLocalDateInput(new Date(Date.now() + 7 * 86400000))).length} icon="▤" iconBg="#EFEDFF" color="#7667E8" foot="Upcoming payments" /><StatCard label="Paid" value={billReminders.filter((item) => item.paid === true).length} icon="✓" iconBg="#E9F8F2" color="#36A891" foot="Completed reminders" /></div>
              {billReminders.length ? <section className="panel"><div className="transaction-list">{billReminders.map((item) => { const status = item.paid === true ? "Paid" : item.dueDate < getDate() ? "Overdue" : item.dueDate === getDate() ? "Due today" : "Upcoming"; const statusClass = status === "Paid" ? "success" : status === "Overdue" ? "danger" : status === "Due today" ? "warning" : ""; return <div className="transaction-row reminder-row" key={item.id}><div className="category-icon">▣</div><div><span className="transaction-title">{item.title}</span><span className="transaction-subtitle">{item.category} · {item.account}{item.note ? ` · ${item.note}` : ""}</span></div><div className="reminder-date">{recordMoney(item.amount, item.currencyCode || "INR")}<div style={{ marginTop: 5 }}><span className={`status-pill ${statusClass}`}>{status}</span></div></div><span className="transaction-date">{formatDate(item.dueDate, dateFormat)}</span><div className="feature-card-actions"><button type="button" className="secondary-button" onClick={() => toggleBillPaid(item)}>{item.paid === true ? "Mark unpaid" : "Mark paid"}</button><button type="button" className="action-button" onClick={() => openEditBillReminder(item)} title="Edit reminder">✎</button><button type="button" className="action-button" onClick={() => deleteBillReminder(item)} title="Delete reminder">✕</button></div></div>; })}</div></section> : <section className="panel"><div className="empty-state">No bill reminders yet. Add rent, utilities, subscriptions or other due payments.</div></section>}
              <p className="feature-page-intro" style={{ marginTop: 14 }}>FinPilot shows these reminders inside the application. Browser push notifications and reminders while the app is closed are not enabled in this version. Marking a bill paid updates the reminder only; add a separate transaction to update your recorded expenses.</p>
            </>
          )}

          {activePage === "Financial Health" && (
            <>
              <section className="panel health-hero">
                <div className="health-score-ring" style={{ "--health-score": `${financialHealthScore}%` }}><div><strong>{financialHealthScore}</strong><span>/100</span></div></div>
                <div className="health-summary"><span className="status-pill">{financialHealthLabel}</span><h2>Your Financial Health Score</h2><p>This transparent estimate uses your recorded savings rate, overall budget use, expense stability and current-month record keeping. It is an educational indicator, not a credit score or financial advice.</p></div>
              </section>
              <div className="feature-grid" style={{ marginTop: 18 }}>
                {[{name:"Savings rate", score:savingsHealthScore, detail:`Current savings rate: ${savingsRate.toFixed(1)}%`},{name:"Budget control",score:budgetHealthScore,detail:budgetInInr>0?`${budgetUsed.toFixed(1)}% of overall budget used`:"Set a monthly budget to improve this component"},{name:"Expense stability",score:expenseStabilityScore,detail:positiveMonths.length>1?"Based on variation across up to three completed months":"More monthly history is needed"},{name:"Record keeping",score:recordKeepingScore,detail:`${monthTransactions.length} transactions recorded this month`}].map((item)=><section className="feature-card" key={item.name}><div className="feature-card-top"><div><h3>{item.name}</h3><p>{item.detail}</p></div><strong className="health-component-score">{Math.round(item.score)}/100</strong></div><div className="goal-progress"><span style={{width:`${item.score}%`}} /></div></section>)}
              </div>
            </>
          )}

          {activePage === "Forecast" && (
            <>
              <div className="stats-grid"><StatCard label="Current Month Expenses" value={displayMoney(expenses)} icon="↘" iconBg="#FFF0F1" color="#E47D8D" foot="Recorded so far" /><StatCard label="Estimated Month-end" value={displayMoney(predictedMonthEndExpenses)} icon="⌁" iconBg="#EFEDFF" color="#7667E8" foot="Simple pace + history estimate" /><StatCard label="Recent Monthly Average" value={displayMoney(historicalExpenseAverage)} icon="◷" iconBg="#E9F8F2" color="#36A891" foot="Up to 3 completed months" /><StatCard label="Projected Difference" value={`${forecastVariance >= 0 ? "+" : "−"}${displayMoney(Math.abs(forecastVariance))}`} icon="↕" iconBg="#FFF5E9" color={forecastVariance > 0 ? "#E47D8D" : "#36A891"} foot="Compared with recent average" /></div>
              <section className="panel"><div className="section-heading"><div><h2>Expense projection</h2><p>Based on current-month daily pace and up to three completed months.</p></div><span className="status-pill">Estimate</span></div><div className="forecast-bars"><div><span>Current month so far</span><div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(100, expenses / Math.max(predictedMonthEndExpenses,1) * 100)}%`}} /></div><strong>{displayMoney(expenses)}</strong></div><div><span>Estimated month-end</span><div className="progress-track"><div className="progress-fill forecast-fill" style={{width:`${Math.min(100, predictedMonthEndExpenses / Math.max(predictedMonthEndExpenses,1) * 100)}%`}} /></div><strong>{displayMoney(predictedMonthEndExpenses)}</strong></div><div><span>Recent monthly average</span><div className="progress-track"><div className="progress-fill average-fill" style={{width:`${Math.min(100, historicalExpenseAverage / Math.max(predictedMonthEndExpenses,1) * 100)}%`}} /></div><strong>{displayMoney(historicalExpenseAverage)}</strong></div></div><p className="feature-page-intro" style={{marginTop:18}}>Forecasts are calculated locally from your transaction history. They are estimates, not guarantees. If there is insufficient history, FinPilot uses the current month's spending pace.</p></section>
            </>
          )}

          {activePage === "Split Expenses" && (
            <>
              <div className="section-heading"><div><h2>Split Expenses</h2><p>Split a purchase equally among you and other people, then track settlements.</p></div><button type="button" className="primary-button" onClick={openAddSplitExpense}>＋ Split an Expense</button></div>
              <p className="feature-page-intro">Split records are private to your account. Names and emails are tracking labels; this page does not send invitations or collect payments.</p>
              {splitExpenses.length ? <div className="feature-grid">{splitExpenses.map((item)=><section className="feature-card" key={item.id}><div className="feature-card-top"><div><h3>{item.title}</h3><p>{item.category} · {formatDate(item.date,dateFormat)}</p></div><strong>{recordMoney(item.totalAmount,item.currencyCode||"INR")}</strong></div><div className="feature-card-meta"><span>{(item.participants||[]).length} participants including you</span><span>Currency: {item.currencyCode||"INR"}</span></div><div className="split-participant-list">{(item.participants||[]).map((person)=><div className="split-participant" key={person.id}><span>{person.name}{person.isOwner?" (you)":""}</span><strong>{recordMoney(person.shareAmount,item.currencyCode||"INR")}</strong>{person.isOwner?<span className="status-pill success">Paid by you</span>:<button type="button" className={`status-pill ${person.settled?"success":"warning"}`} onClick={()=>toggleSplitSettlement(item,person.id)}>{person.settled?"Settled":"Mark settled"}</button>}</div>)}</div><div className="feature-card-actions"><button type="button" className="action-button" onClick={()=>deleteSplitExpense(item)}>Delete split</button></div></section>)}</div> : <section className="panel"><div className="empty-state">No split expenses yet. Create one and add participant names to divide the cost.</div></section>}
            </>
          )}

          {activePage === "Shared Budgets" && (
            <>
              <div className="section-heading"><div><h2>Shared Budgets</h2><p>Collaborate with signed-in FinPilot users by inviting their registered email addresses.</p></div><button type="button" className="primary-button" onClick={openCreateSharedBudget}>＋ Create Shared Budget</button></div>
              <p className="feature-page-intro">Invited members can view the shared budget and add shared expense entries. Only the owner can delete the budget. Publish the included Firestore rules before using this feature.</p>
              {sharedBudgets.length ? <div className="feature-grid">{sharedBudgets.map((item)=>{return <section className={`feature-card ${selectedSharedBudgetId===item.id?"selected-feature-card":""}`} key={item.id}><div className="feature-card-top"><div><h3>{item.name}</h3><p>{item.description||`Owned by ${item.ownerName||item.ownerEmail||"FinPilot user"}`}</p></div><span className={`status-pill ${item.ownerUid===currentUser.uid?"success":""}`}>{item.ownerUid===currentUser.uid?"Owner":"Invited member"}</span></div><div className="budget-total" style={{fontSize:21}}>{recordMoney(item.monthlyLimit,item.currencyCode||"INR")}</div><div className="feature-card-meta"><span>{(item.memberEmails||[]).length} invited member(s)</span><span>{item.ownerEmail||""}</span></div><div className="feature-card-actions"><button type="button" className="secondary-button" onClick={()=>setSelectedSharedBudgetId(item.id)}>{selectedSharedBudgetId===item.id?"Selected":"Open budget"}</button>{item.ownerUid===currentUser.uid&&<button type="button" className="action-button" onClick={()=>deleteSharedBudget(item)}>Delete</button>}</div></section>})}</div> : <section className="panel"><div className="empty-state">No shared budgets yet. Create one and invite collaborators by their registered email address.</div></section>}
              {selectedSharedBudget&&<section className="panel" style={{marginTop:18}}><div className="section-heading"><div><h2>{selectedSharedBudget.name} · Shared expenses</h2><p>Members can add entries to this shared workspace.</p></div><button type="button" className="primary-button" onClick={()=>{setSharedExpenseForm({title:"",amount:"100",date:getDate(),category:"Other",note:""});setSharedExpenseModalOpen(true);}}>＋ Add Shared Expense</button></div><div className="stats-grid" style={{marginTop:12}}><StatCard label="Monthly limit" value={recordMoney(selectedSharedBudget.monthlyLimit,selectedSharedBudget.currencyCode||"INR")} icon="◫" iconBg="#EFEDFF" color="#7667E8" foot="Shared workspace limit"/><StatCard label="Entries loaded" value={sharedBudgetEntries.length} icon="↕" iconBg="#E9F8F2" color="#36A891" foot="All recorded shared entries"/><StatCard label="Total recorded" value={displayMoney(sharedBudgetEntries.reduce((sum,entry)=>sum+recordAmountInInr(entry.amount,entry.currencyCode||"INR"),0))} icon="₹" iconBg="#FFF5E9" color="#E9A34B" foot="Converted to your display currency"/></div><div className="budget-meta"><span>Invited members: {(selectedSharedBudget.memberEmails||[]).join(", ")||"No invited members yet"}</span></div>{sharedBudgetEntries.length?<div className="transaction-list">{sharedBudgetEntries.map((entry)=><div className="transaction-row" key={entry.id}><div className="category-icon">⇄</div><div><span className="transaction-title">{entry.title}</span><span className="transaction-subtitle">{entry.category} · Added by {entry.createdByName||entry.createdByEmail||"Member"}{entry.note?` · ${entry.note}`:""}</span></div><strong className="transaction-amount">{recordMoney(entry.amount,entry.currencyCode||"INR")}</strong><span className="transaction-date">{formatDate(entry.date,dateFormat)}</span></div>)}</div>:<div className="empty-state">No shared entries yet.</div>}</section>}
            </>
          )}

          {activePage === "Assistant" && (
            <section className="panel assistant-panel"><div className="section-heading"><div><h2>FinPilot Financial Assistant</h2><p>Ask questions about your recorded finances. Replies are based on your data.</p></div><span className="status-pill">Private data context</span></div><div className="assistant-disclaimer">The built-in assistant uses local, rule-based answers. To enable a generative AI model, configure a secure server endpoint; never place an AI API key in browser code.</div><div className="assistant-suggestions">{["How much did I spend this month?","What is my largest expense?","Which category costs me the most?","How much budget is left?","What is my expense forecast?","What is my financial health score?"].map((prompt)=><button type="button" className="secondary-button" key={prompt} onClick={()=>setAssistantQuestion(prompt)}>{prompt}</button>)}</div><div className="assistant-chat" aria-live="polite">{assistantMessages.length?assistantMessages.map((message,index)=><div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}><strong>{message.role==="user"?"You":"FinPilot"}</strong><p>{message.text}</p></div>):<div className="empty-state">Ask your first question to explore your financial activity.</div>}{assistantBusy&&<div className="assistant-message assistant"><strong>FinPilot</strong><p>Reviewing your financial summary…</p></div>}</div><form className="assistant-input-row" onSubmit={sendAssistantQuestion}><input value={assistantQuestion} onChange={(event)=>setAssistantQuestion(event.target.value)} placeholder="Ask about your income, spending or budgets…" maxLength={500}/><button className="primary-button" type="submit" disabled={assistantBusy||!assistantQuestion.trim()}>{assistantBusy?"Thinking…":"Ask"}</button></form></section>
          )}

          {activePage === "Receipt Scanner" && (
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Receipt Scanner</h2>
                  <p>Extract a draft from a receipt image or PDF using on-device processing.</p>
                </div>
                <span className="status-pill">Local processing on this device</span>
              </div>
              <p className="feature-page-intro">
                Choose a JPG, PNG, WebP or PDF file. Searchable PDFs are read directly; scanned PDFs and images use English OCR. OCR may misread merchant names, amounts or dates, so always review the draft before creating a transaction. Files are processed in your browser and are not uploaded to FinPilot's server.
              </p>
              <label className="receipt-upload-zone">
                <span className="receipt-upload-icon">▧</span>
                <strong>{receiptScanning ? `Reading receipt… ${receiptProgress}%` : "Choose receipt image or PDF"}</strong>
                <small>JPG, PNG, WebP or PDF · Up to 10 MB · PDF up to 5 pages · English OCR for scanned files</small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.pdf,application/pdf"
                  onChange={scanReceipt}
                  disabled={receiptScanning}
                />
              </label>
              {receiptScanning && <div className="progress-track"><div className="progress-fill" style={{ width: `${receiptProgress}%` }} /></div>}
              {receiptDraft && (
                <section className="feature-card" style={{ marginTop: 16 }}>
                  <div className="section-heading">
                    <div>
                      <h2>Review extracted details</h2>
                      <p>{receiptDraft.sourceType === "PDF" ? "PDF extraction complete. Verify the details before creating a transaction." : "OCR complete. Verify the details before creating a transaction."}</p>
                    </div>
                    <span className="status-pill">{receiptDraft.sourceType === "PDF" ? "PDF" : "Image"}</span>
                  </div>
                  <div className="form-grid">
                    <div className="form-field"><label>Suggested description</label><input readOnly value={receiptDraft.title} /></div>
                    <div className="form-field"><label>Suggested amount ({displayCurrencyCode})</label><input readOnly value={receiptDraft.amount || "Not detected"} /></div>
                    <div className="form-field"><label>Suggested date</label><input readOnly value={receiptDraft.date || "Not detected"} /></div>
                  </div>
                  <button type="button" className="primary-button" onClick={useReceiptDraft} disabled={!receiptDraft.amount}>Use draft in Add Transaction</button>
                </section>
              )}
              {receiptText && <details className="receipt-text-details"><summary>View extracted text</summary><pre>{receiptText}</pre></details>}
            </section>
          )}

          {activePage === "Statement Import" && (
            <>
              <section className="panel"><div className="section-heading"><div><h2>Import Bank Statement</h2><p>Import transactions from CSV or PDF bank statements while preserving each row's currency.</p></div><span className="status-pill">CSV 5 MB · PDF 15 MB</span></div>
                <p className="feature-page-intro">CSV: Date and Description plus Amount or Debit/Credit columns. PDF: text is extracted locally; scanned PDFs use English OCR (up to 25 pages). Review every parsed row before importing. CSV rows without a currency default to INR. Dates after today are rejected.</p>
                <div className="feature-card-actions" style={{ marginBottom: 14 }}><button type="button" className="secondary-button" onClick={exportFullBackup} disabled={backupExporting}>{backupExporting ? "Preparing backup…" : "↓ Export Full Data Backup (JSON)"}</button></div>
                <label className="csv-upload-zone"><span className="receipt-upload-icon">⇧</span><strong>{csvImportFileName || "Choose a CSV or PDF statement"}</strong><small>CSV up to 5 MB · PDF up to 15 MB · Text and scanned PDFs supported</small><input type="file" accept=".csv,.pdf,text/csv,application/pdf" onChange={handleCsvFileSelected} disabled={statementParsing}/></label>{statementParsing && <div style={{marginTop:12}}><div className="budget-meta"><span>Reading statement locally…</span><strong>{statementProgress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${statementProgress}%`}}/></div></div>}
                {csvImportRows.length > 0 && <><div className="stats-grid" style={{ marginTop: 16 }}><StatCard label="Valid rows" value={csvImportRows.length} icon="✓" iconBg="#E9F8F2" color="#36A891" foot="Ready for import"/><StatCard label="Invalid rows" value={csvImportErrors.length} icon="!" iconBg="#FFF0F1" color="#D96A7C" foot="Excluded from import"/><StatCard label="Currencies" value={[...new Set(csvImportRows.map((item) => item.currencyCode))].join(", ")} icon="¤" iconBg="#EFEDFF" color="#7667E8" foot="Per-record currency retained"/></div><div className="table-wrap"><table className="transaction-table"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th>Account</th><th>Amount</th><th>Currency</th></tr></thead><tbody>{csvImportRows.slice(0, 15).map((item, index) => <tr key={`${item.date}-${item.title}-${index}`}><td>{formatDate(item.date,dateFormat)}</td><td>{item.title}</td><td>{item.type}</td><td>{item.category}</td><td>{item.account}</td><td>{Number(item.amount).toFixed(2)}</td><td>{item.currencyCode}</td></tr>)}</tbody></table></div>{csvImportRows.length > 15 && <p className="feature-page-intro">Showing first 15 of {csvImportRows.length} valid rows.</p>}<div className="feature-card-actions"><button className="primary-button" type="button" onClick={importCsvTransactions} disabled={csvImportBusy}>{csvImportBusy?"Importing…":`Import ${csvImportRows.length} valid transaction(s)`}</button><button className="secondary-button" type="button" onClick={()=>{setCsvImportRows([]);setCsvImportErrors([]);setCsvImportFileName("");setCsvImportResult("");}}>Clear preview</button></div></>}
                {csvImportErrors.length > 0 && <details className="csv-errors"><summary>{csvImportErrors.length} invalid row(s) excluded — view details</summary>{csvImportErrors.slice(0, 50).map((item) => <p key={`${item.row}-${item.reason}`}>Row {item.row}: {item.reason}</p>)}</details>}
                {csvImportResult && <p className="import-success" role="status">{csvImportResult}</p>}
              </section>
              <section className="panel" style={{marginTop:16}}><h3>CSV template</h3><p className="feature-page-intro">Use this header row when preparing a CSV file. You can also use standard bank exports with separate Debit and Credit columns. Exact duplicate rows are skipped on subsequent imports.</p><code className="csv-template">Date,Description,Type,Category,Account,Amount,Currency,Notes<br/>{getDate()},Grocery Shopping,expense,Food,UPI,450.50,INR,Weekly groceries</code><button type="button" className="secondary-button" style={{marginTop:12}} onClick={()=>{const template=`Date,Description,Type,Category,Account,Amount,Currency,Notes\r\n${getDate()},Grocery Shopping,expense,Food,UPI,450.50,INR,Weekly groceries\r\n`;const blob=new Blob(["\uFEFF",template],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="finpilot-import-template.csv";link.click();URL.revokeObjectURL(url);}}>↓ Download CSV template</button></section>
            </>
          )}

          {activePage === "Achievements" && (() => {
            const distinctDates = [...new Set(transactions.map((item) => item.date).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
            let streak = 0;
            if (distinctDates.length) {
              const latest = new Date(`${distinctDates[0]}T00:00:00`);
              const todayDate = new Date(`${getDate()}T00:00:00`);
              const gap = Math.round((todayDate - latest) / 86400000);
              if (gap <= 1) {
                let expected = new Date(latest);
                for (const dateValue of distinctDates) {
                  if (dateValue === toLocalDateInput(expected)) { streak += 1; expected.setDate(expected.getDate()-1); }
                  else if (dateValue < toLocalDateInput(expected)) break;
                }
              }
            }
            const achievements = [
              {id:"first_record",icon:"🌱",title:"First Step",description:"Record your first transaction.",earned:transactions.length>=1,progress:Math.min(transactions.length,1),target:1},
              {id:"ten_records",icon:"📘",title:"Consistent Tracker",description:"Record 10 transactions.",earned:transactions.length>=10,progress:Math.min(transactions.length,10),target:10},
              {id:"fifty_records",icon:"📚",title:"Money Organiser",description:"Record 50 transactions.",earned:transactions.length>=50,progress:Math.min(transactions.length,50),target:50},
              {id:"three_day_streak",icon:"🔥",title:"Three-day Streak",description:"Track transactions on three consecutive days.",earned:streak>=3,progress:Math.min(streak,3),target:3},
              {id:"seven_day_streak",icon:"⚡",title:"Weekly Habit",description:"Track transactions on seven consecutive days.",earned:streak>=7,progress:Math.min(streak,7),target:7},
              {id:"first_goal",icon:"🎯",title:"Goal Setter",description:"Create your first savings goal.",earned:savingsGoals.length>=1,progress:Math.min(savingsGoals.length,1),target:1},
              {id:"goal_complete",icon:"🏆",title:"Goal Achieved",description:"Reach a savings goal target.",earned:savingsGoals.some((goal)=>goalSavedAmountInInr(goal)>=goalTargetAmountInInr(goal)&&goalTargetAmountInInr(goal)>0),progress:savingsGoals.some((goal)=>goalSavedAmountInInr(goal)>=goalTargetAmountInInr(goal)&&goalTargetAmountInInr(goal)>0)?1:0,target:1},
              {id:"positive_month",icon:"💚",title:"Positive Month",description:"Finish a month with income above expenses.",earned:savings>0,progress:savings>0?1:0,target:1},
              {id:"budget_setup",icon:"🧭",title:"Budget Planner",description:"Set at least one category budget.",earned:categoryBudgets.length>0,progress:Math.min(categoryBudgets.length,1),target:1},
              {id:"split_first",icon:"🤝",title:"Shared the Cost",description:"Create your first split expense.",earned:splitExpenses.length>0,progress:Math.min(splitExpenses.length,1),target:1},
              {id:"account_setup",icon:"👛",title:"Wallet Builder",description:"Set up at least two accounts or wallets.",earned:accounts.length>=2,progress:Math.min(accounts.length,2),target:2},
            ];
            const earnedCount = achievements.filter((item)=>item.earned).length;
            return <><section className="panel"><div className="section-heading"><div><h2>Achievements & Rewards</h2><p>Milestones are calculated from your real FinPilot activity.</p></div><span className="status-pill success">{earnedCount} / {achievements.length} earned</span></div><div className="achievement-summary"><div><strong>{earnedCount*100}</strong><span>FinPoints</span></div><div><strong>{streak}</strong><span>Current tracking streak (days)</span></div><div><strong>{transactions.length}</strong><span>Transactions recorded</span></div></div><div className="achievement-grid">{achievements.map((item)=><article className={`achievement-card ${item.earned?"earned":"locked"}`} key={item.id}><div className="achievement-icon">{item.icon}</div><div className="achievement-copy"><h3>{item.title}</h3><p>{item.description}</p><div className="goal-progress"><span style={{width:`${Math.min(100,(item.progress/item.target)*100)}%`}}/></div><small>{item.earned?"Unlocked":`${item.progress} / ${item.target} progress`}</small></div><span className={`status-pill ${item.earned?"success":""}`}>{item.earned?"Earned":"Locked"}</span></article>)}</div></section><p className="feature-page-intro" style={{marginTop:12}}>Achievements are informational milestones, not cash rewards or financial advice. They update automatically when your records change and are calculated from your account activity.</p></>;
          })()}

          {activePage === "Categories" && (
            <>
              <div className="section-heading"><div><h2>Manage Categories</h2><p>Create categories that match your personal spending and income types.</p></div><button className="primary-button" onClick={openAddCategoryModal}>＋ Add Category</button></div>
              <div className="category-management-grid">
                {[
                  { key: "expense", title: "Expense Categories", items: expenseCategories },
                  { key: "income", title: "Income Categories", items: incomeCategories },
                ].map((group) => (
                  <section className="panel" key={group.key}>
                    <div className="section-heading">
                      <div><h2>{group.title}</h2><p>{group.items.length} available</p></div>
                    </div>
                    <p className="category-order-hint">Drag the grip handle to rearrange categories, or use the ↑ and ↓ buttons. Scroll the list to see more categories.</p>
                    <div className="category-management-list">
                      {group.items.map((item, index) => {
                        const itemKey = categoryOrderKey(item);
                        const visualKey = `${group.key}:${itemKey}`;
                        return (
                        <div
                          className={`category-management-row${draggingCategory === visualKey ? " is-dragging" : ""}${dragOverCategory === visualKey && draggingCategory !== visualKey ? " is-drag-over" : ""}`}
                          key={`${group.key}-${item.id || item.name}`}
                          data-category-row
                          data-category-type={group.key}
                          data-category-key={itemKey}
                        >
                          <button
                            type="button"
                            className="category-drag-handle"
                            title={`Drag to reorder ${item.name}`}
                            aria-label={`Drag to reorder ${item.name}`}
                            disabled={categoryOrderSaving}
                            onPointerDown={(event) => startCategoryDrag(event, group.key, item)}
                            onPointerMove={updateCategoryDrag}
                            onPointerUp={finishCategoryDrag}
                            onPointerCancel={cancelCategoryDrag}
                            onLostPointerCapture={cancelCategoryDrag}
                          >⠿</button>
                          <div className="category-icon">{item.icon || "✦"}</div>
                          <div className="category-details">
                            <strong>{item.name}</strong>
                            <small>{item.custom ? "Custom category" : "Default category"}</small>
                          </div>
                          <div className="category-management-actions">
                            <div className="category-reorder-actions">
                              <button
                                type="button"
                                className="category-move-button"
                                title={`Move ${item.name} up`}
                                aria-label={`Move ${item.name} up`}
                                disabled={index === 0 || categoryOrderSaving}
                                onClick={() => moveCategory(group.key, index, -1)}
                              >↑</button>
                              <button
                                type="button"
                                className="category-move-button"
                                title={`Move ${item.name} down`}
                                aria-label={`Move ${item.name} down`}
                                disabled={index === group.items.length - 1 || categoryOrderSaving}
                                onClick={() => moveCategory(group.key, index, 1)}
                              >↓</button>
                            </div>
                            {item.custom ? (
                              <>
                                <button type="button" className="action-button" title="Rename category" aria-label={`Rename ${item.name}`} onClick={() => openEditCategoryModal(item)}>✎</button>
                                <button type="button" className="action-button" title="Delete category" aria-label={`Delete ${item.name}`} onClick={() => removeCategory(item)}>✕</button>
                              </>
                            ) : <span className="category-tag">Default</span>}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

          {activePage === "Profile" && (
            <section className="profile-card">
              <div className="profile-header-row">
                <div className="profile-avatar-large">
                  {profilePhotoData
                    ? <img src={profilePhotoData} alt="Your profile" />
                    : (profileName || currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="profile-photo-copy">
                  <strong>Profile Photo</strong>
                  <p>Use a JPG, PNG or WebP image. FinPilot will crop it to a square and reduce its size for secure profile storage.</p>
                  <div className="profile-photo-actions">
                    <input ref={profilePhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhotoSelected} style={{ display: "none" }} aria-label="Choose a profile photo" />
                    <button type="button" className="profile-photo-button" disabled={profilePhotoBusy} onClick={() => profilePhotoInputRef.current?.click()}>{profilePhotoBusy ? "Processing..." : profilePhotoData ? "Change Photo" : "Upload Photo"}</button>
                    {profilePhotoData && <button type="button" className="profile-photo-button" onClick={() => setProfilePhotoPreviewOpen(true)}>View Photo</button>}
                    {profilePhotoData && <button type="button" className="profile-photo-button danger" disabled={profilePhotoBusy} onClick={removeProfilePhoto}>Remove Photo</button>}
                  </div>
                </div>
              </div>
              <h2 style={{ font: "800 21px Manrope, sans-serif", margin: "0 0 6px" }}>Personal Information</h2>
              <p className="profile-email-note">Your email is used for sign-in. The additional details below are optional and can be changed at any time.</p>
              <form onSubmit={saveProfile}>
                <div className="profile-form-grid">
                  <div className="form-field"><label htmlFor="profile-name">Full Name *</label><input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} required maxLength={80} autoComplete="name" /></div>
                  <div className="form-field"><label htmlFor="profile-email">Email Address</label><input id="profile-email" value={currentUser.email || ""} readOnly disabled /></div>
                  <div className="form-field"><label htmlFor="profile-phone">Phone Number (Optional)</label><input id="profile-phone" type="tel" inputMode="tel" placeholder="e.g. +91 98765 43210" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} maxLength={20} autoComplete="tel" /></div>
                  <div className="form-field"><label htmlFor="profile-country">Country / Region (Optional)</label><input id="profile-country" placeholder="e.g. India" value={profileCountry} onChange={(event) => setProfileCountry(event.target.value)} maxLength={80} autoComplete="country-name" /></div>
                  <div className="form-field"><label htmlFor="profile-occupation">Occupation (Optional)</label><input id="profile-occupation" placeholder="e.g. Student, Professional" value={profileOccupation} onChange={(event) => setProfileOccupation(event.target.value)} maxLength={80} autoComplete="organization-title" /></div>
                </div>
                <p className="profile-email-note">We don't ask for bank passwords, card PINs, government ID numbers or your full home address in your profile.</p>
                <button type="submit" className="primary-button" disabled={profileSaving}>{profileSaving ? "Saving..." : "Save Profile"}</button>
              </form>
            </section>
          )}

          {activePage === "Settings" && (
            <section className="settings-card">
              <div className="section-heading"><div><h2>Application Preferences</h2><p>Appearance previews immediately. Currency and date preferences are applied when you save. Leaving this page without saving discards your changes.</p></div></div>
              <form onSubmit={saveAppSettings}>
                <div className="settings-row">
                  <div>
                    <strong>Transaction &amp; Display Currency</strong>
                    <small>New transactions are saved in this currency. New budgets, goals, contributions, reminders, recurring schedules and transactions are saved in this preferred currency. Existing records retain their own currency and are converted for totals and display. Legacy records are treated as INR.</small>
                  </div>
                  <div>
                    <select className="filter-control" value={draftCurrencyCode} onChange={(event) => setDraftCurrencyCode(event.target.value)} disabled={ratesLoading || currencyOptions.length <= 1}>
                      {currencyOptions.map((code) => (
                        <option key={code} value={code}>{currencyName(code)} ({code} · {currencySymbol(code)})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="settings-rate-note" style={{ fontSize: 11, lineHeight: 1.6, marginTop: -5, marginBottom: 12 }}>
                  {ratesLoading
                    ? "Loading supported currencies and daily exchange rates..."
                    : ratesUpdatedUnix
                      ? `Reference rates last updated ${new Date(ratesUpdatedUnix * 1000).toLocaleString("en-IN")}. Rates are indicative and may differ from bank or card rates.`
                      : "Only INR is available until exchange rates can be loaded."}
                  {ratesError && <div role="status" style={{ marginTop: 4 }}>{ratesError}</div>}
                  <div style={{ marginTop: 4 }}>Exchange-rate data provided by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates By Exchange Rate API</a>.</div>
                </div>
                <div className="settings-row"><div><strong>Date Format</strong><small>Choose how transaction dates appear throughout the app.</small></div><select className="filter-control" value={draftDateFormat} onChange={(event) => setDraftDateFormat(event.target.value)}><option value="dd MMM yyyy">15 Nov 2026</option><option value="dd/MM/yyyy">15/11/2026</option><option value="yyyy-MM-dd">2026-11-15</option></select></div>
                <div className="settings-row"><div><strong>Appearance</strong><small>Preview the entire interface immediately. Save to keep this theme; leaving Settings without saving restores the previous theme.</small></div><select className="filter-control" value={draftTheme} onChange={(event) => { const nextTheme = event.target.value; setDraftTheme(nextTheme); setTheme(nextTheme); }}><option value="light">Light</option><option value="dark">Dark</option></select></div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
                  <button type="button" className="secondary-button" disabled={settingsSaving || (draftTheme === savedTheme && draftDateFormat === dateFormat && draftCurrencyCode === currencyCode)} onClick={() => { setTheme(savedTheme); setDraftTheme(savedTheme); setDraftDateFormat(dateFormat); setDraftCurrencyCode(currencyCode); }}>Discard Changes</button>
                  <button type="submit" className="primary-button" disabled={settingsSaving || !settingsReady}>{settingsSaving ? "Saving..." : "Save Settings"}</button>
                </div>
              </form>
            </section>
          )}

          {activePage === "Admin Support" && isSupportAdmin && (
            <>
              <section className="support-hero">
                <div className="support-hero-icon">✉</div>
                <div>
                  <span className="support-eyebrow">ADMINISTRATOR WORKSPACE</span>
                  <h2>Customer Support Inbox</h2>
                  <p>Review customer issues and enquiries, reply to customers and update their request status.</p>
                </div>
              </section>
              <section className="panel support-requests-panel">
                <div className="section-heading">
                  <div><h2>All customer requests</h2><p>{adminSupportRequests.length} request(s) across FinPilot accounts.</p></div>
                  <select className="filter-control" value={adminSupportFilter} onChange={(event) => setAdminSupportFilter(event.target.value)} aria-label="Filter support requests">
                    <option>All</option><option>Open</option><option>In Progress</option><option>Resolved</option>
                  </select>
                </div>
                {adminSupportNotice && <p className={`support-notice ${adminSupportNotice.type}`} role="status">{adminSupportNotice.message}</p>}
                {adminSupportError && <p className="support-notice error" role="alert">{adminSupportError}</p>}
                {adminSupportLoading ? <div className="empty-state">Loading customer requests…</div> : (() => {
                  const visibleRequests = adminSupportRequests.filter((request) => adminSupportFilter === "All" || (request.status === "Submitted" ? "Open" : request.status || "Open") === adminSupportFilter);
                  return visibleRequests.length ? (
                    <div className="support-request-list">
                      {visibleRequests.map((request) => {
                        const status = adminStatusDrafts[request.id] || (request.status === "Submitted" ? "Open" : request.status || "Open");
                        const reply = adminReplyDrafts[request.id] ?? request.adminReply ?? "";
                        return (
                          <article className="support-request-card" key={request.id}>
                            <div className="support-request-top">
                              <div>
                                <span className={`support-type-pill ${request.type === "contact" ? "contact" : "issue"}`}>{request.type === "contact" ? "Contact message" : "Issue report"}</span>
                                <h3>{request.subject || "Untitled request"}</h3>
                                <p>{request.contactName || "FinPilot customer"} · {request.contactEmail || "No email supplied"} · {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable"}</p>
                                <p>Customer UID: {request.userId || "Unavailable"}</p>
                              </div>
                              <span className={`status-pill ${status === "Resolved" ? "success" : status === "In Progress" ? "info" : "warning"}`}>{status}</span>
                            </div>
                            <p className="support-request-message">{request.message}</p>
                            <div className="form-grid" style={{ marginTop: 15 }}>
                              <div className="form-field">
                                <label htmlFor={`support-status-${request.id}`}>Request status</label>
                                <select id={`support-status-${request.id}`} value={status} onChange={(event) => setAdminStatusDrafts((old) => ({ ...old, [request.id]: event.target.value }))}>
                                  <option>Open</option><option>In Progress</option><option>Resolved</option>
                                </select>
                              </div>
                              <div className="form-field">
                                <label>Customer reply email</label>
                                <input readOnly value={request.contactEmail || "No email supplied"} />
                              </div>
                            </div>
                            <div className="form-field" style={{ marginTop: 12 }}>
                              <label htmlFor={`support-reply-${request.id}`}>Your reply (visible in customer's My Requests)</label>
                              <textarea id={`support-reply-${request.id}`} rows={4} maxLength={3000} value={reply} onChange={(event) => setAdminReplyDrafts((old) => ({ ...old, [request.id]: event.target.value }))} placeholder="Write a helpful response to the customer…" />
                              <small className="support-character-count">{reply.length}/3000 characters</small>
                            </div>
                            <div className="support-submit-row">
                              <button type="button" className="primary-button" disabled={adminSavingRequestId === request.id} onClick={() => saveAdminSupportUpdate(request)}>{adminSavingRequestId === request.id ? "Saving…" : "Save reply & status"}</button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : <div className="support-empty-state"><span>✓</span><strong>No requests in this view</strong><p>Try another status filter or check again when a customer submits a request.</p></div>;
                })()}
              </section>
              <p className="support-delivery-note">Replies are stored in Firestore and displayed in the customer's My Requests page. This does not send an email notification; contact the customer by email separately if an immediate notification is needed.</p>
            </>
          )}

          {activePage === "Support Centre" && (
            <>
              <section className="support-hero">
                <div className="support-hero-icon">♡</div>
                <div>
                  <span className="support-eyebrow">FINPILOT HELP DESK</span>
                  <h2>How can we help?</h2>
                  <p>Report a problem, ask a question or review messages you've sent from your account.</p>
                </div>
              </section>

              <div className="support-tabs" role="tablist" aria-label="Support options">
                <button type="button" role="tab" aria-selected={supportMode === "issue"} className={supportMode === "issue" ? "active" : ""} onClick={() => { setSupportMode("issue"); setSupportNotice(null); }}>⚑ Report an Issue</button>
                <button type="button" role="tab" aria-selected={supportMode === "contact"} className={supportMode === "contact" ? "active" : ""} onClick={() => { setSupportMode("contact"); setSupportNotice(null); }}>✉ Contact Us</button>
                <button type="button" role="tab" aria-selected={supportMode === "requests"} className={supportMode === "requests" ? "active" : ""} onClick={() => { setSupportMode("requests"); setSupportNotice(null); }}>▤ My Requests <span className="support-count">{supportRequests.length}</span></button>
              </div>

              {supportMode === "issue" || supportMode === "contact" ? (
                <section className="panel support-form-panel">
                  <div className="section-heading">
                    <div>
                      <h2>{supportMode === "issue" ? "Report an issue" : "Contact the FinPilot team"}</h2>
                      <p>{supportMode === "issue" ? "Tell us what went wrong and what you were doing when it happened." : "Send a general question, suggestion or feedback message."}</p>
                    </div>
                    <span className="status-pill">Private to your account</span>
                  </div>
                  <form onSubmit={submitSupportRequest}>
                    {supportMode === "issue" && (
                      <div className="form-field">
                        <label htmlFor="support-category">Issue type</label>
                        <select id="support-category" value={supportForm.category} onChange={(event) => setSupportForm((old) => ({ ...old, category: event.target.value }))}>
                          <option>Bug or error</option>
                          <option>Sign-in or account access</option>
                          <option>Transaction or balance issue</option>
                          <option>Import or export issue</option>
                          <option>Display or navigation issue</option>
                          <option>Feature request</option>
                          <option>Other</option>
                        </select>
                      </div>
                    )}
                    <div className="form-grid">
                      <div className="form-field">
                        <label htmlFor="support-name">Your name</label>
                        <input id="support-name" value={profileName || currentUser.displayName || ""} readOnly placeholder="Add your name in Profile" />
                      </div>
                      <div className="form-field">
                        <label htmlFor="support-email">Reply email</label>
                        <input id="support-email" type="email" value={currentUser.email || ""} readOnly />
                      </div>
                    </div>
                    <div className="form-field">
                      <label htmlFor="support-subject">Subject *</label>
                      <input id="support-subject" required maxLength={100} value={supportForm.subject} onChange={(event) => setSupportForm((old) => ({ ...old, subject: event.target.value }))} placeholder={supportMode === "issue" ? "e.g. Dashboard balance is not updating" : "e.g. Question about account settings"} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="support-message">{supportMode === "issue" ? "Describe the issue *" : "Your message *"}</label>
                      <textarea id="support-message" required rows={7} maxLength={3000} value={supportForm.message} onChange={(event) => setSupportForm((old) => ({ ...old, message: event.target.value }))} placeholder={supportMode === "issue" ? "What happened? What did you expect to happen? Include the steps to reproduce it, but do not include passwords, PINs or full financial account details." : "Write your question, feedback or suggestion here. Do not include passwords, PINs or full financial account details."} />
                      <small className="support-character-count">{supportForm.message.length}/3000 characters</small>
                    </div>
                    <div className="support-privacy-note"><strong>Privacy note:</strong> Your message is saved under your signed-in FinPilot account. Do not include passwords, card PINs, bank login details or other sensitive financial information.</div>
                    {supportNotice && <p className={`support-notice ${supportNotice.type}`} role="status">{supportNotice.message}</p>}
                    <div className="support-submit-row">
                      <button type="submit" className="primary-button" disabled={supportSubmitting}>{supportSubmitting ? "Sending…" : supportMode === "issue" ? "Submit Issue" : "Send Message"}</button>
                    </div>
                  </form>
                </section>
              ) : (
                <section className="panel support-requests-panel">
                  <div className="section-heading"><div><h2>Your Support History</h2><p>Messages submitted from this FinPilot account.</p></div><span className="status-pill">{supportRequests.length} total</span></div>
                  {supportNotice && <p className={`support-notice ${supportNotice.type}`} role="status">{supportNotice.message}</p>}
                  {supportRequestsError && <p className="support-notice error" role="alert">{supportRequestsError}</p>}
                  {supportRequestsLoading ? <div className="empty-state">Loading your requests…</div> : supportRequests.length ? (
                    <div className="support-request-list">
                      {supportRequests.map((request) => (
                        <article className="support-request-card" key={request.id}>
                          <div className="support-request-top">
                            <div>
                              <span className={`support-type-pill ${request.type === "contact" ? "contact" : "issue"}`}>{request.type === "contact" ? "Contact message" : "Issue report"}</span>
                              <h3>{request.subject || "Untitled request"}</h3>
                              <p>{request.category || "General enquiry"} · {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Just submitted"}</p>
                            </div>
                            <span className={`status-pill ${(request.status === "Resolved") ? "success" : (request.status === "In Progress") ? "info" : "warning"}`}>{request.status === "Submitted" ? "Open" : request.status || "Open"}</span>
                          </div>
                          <p className="support-request-message">{request.message}</p>
                          {request.adminReply && <div className="support-admin-reply"><strong>FinPilot team response</strong><p>{request.adminReply}</p><small>{request.repliedAt?.toDate ? request.repliedAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Response updated"}</small></div>}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="support-empty-state"><span>✉</span><strong>No support requests yet</strong><p>Your issue reports and contact messages will appear here after submission.</p><button type="button" className="secondary-button" onClick={() => { setSupportMode("issue"); setSupportNotice(null); }}>Report your first issue</button></div>
                  )}
                </section>
              )}
              <p className="support-delivery-note">Your requests are saved privately to your FinPilot account. When the FinPilot team replies or changes the status, the update appears here. Email notifications are not enabled.</p>
            </>
          )}
        </main>
      </div>

      {accountModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setAccountModalOpen(false);}}>
          <form className="modal" onSubmit={saveAccount}>
            <div className="modal-header"><h2>{editingAccountId?"Edit Account":"Add Account or Wallet"}</h2><button type="button" className="close-button" onClick={()=>setAccountModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="account-name">Account name</label><input id="account-name" required maxLength={60} value={accountForm.name} onChange={(event)=>setAccountForm((old)=>({...old,name:event.target.value}))} placeholder="e.g. HDFC Savings"/></div>
            <div className="form-grid"><div className="form-field"><label htmlFor="account-type">Account type</label><select id="account-type" value={accountForm.type} onChange={(event)=>setAccountForm((old)=>({...old,type:event.target.value}))}><option value="bank">Bank account</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Credit / debit card</option><option value="wallet">Digital wallet</option><option value="other">Other</option></select></div><div className="form-field"><label htmlFor="account-currency">Account currency</label><select id="account-currency" value={accountForm.currencyCode} onChange={(event)=>setAccountForm((old)=>({...old,currencyCode:event.target.value}))}>{currencyOptions.map((code)=><option key={code} value={code}>{code} · {currencySymbol(code)}</option>)}</select></div></div>
            <div className="form-grid"><div className="form-field"><label htmlFor="account-opening">Opening balance ({accountForm.currencyCode})</label><MoneyInput id="account-opening" value={accountForm.openingBalance} onChange={(value)=>setAccountForm((old)=>({...old,openingBalance:value}))} currencyCode={accountForm.currencyCode}/></div><div className="form-field"><label htmlFor="account-opening-date">Opening balance date</label><input id="account-opening-date" type="date" required max={getDate()} value={accountForm.openingBalanceDate} onChange={(event)=>setAccountForm((old)=>({...old,openingBalanceDate:event.target.value}))}/></div></div><small className="muted">Enter the actual balance as of the opening date. Only transactions and transfers on or after that date affect the running balance.</small>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setAccountModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={accountSaving}>{accountSaving?"Saving…":editingAccountId?"Save Account":"Create Account"}</button></div>
          </form>
        </div>
      )}

      {transferModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setTransferModalOpen(false);}}>
          <form className="modal" onSubmit={saveTransfer}>
            <div className="modal-header"><h2>Transfer Between Accounts</h2><button type="button" className="close-button" onClick={()=>setTransferModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="transfer-from">From account</label><select id="transfer-from" required value={transferForm.fromAccountId} onChange={(event)=>setTransferForm((old)=>({...old,fromAccountId:event.target.value}))}>{accounts.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.currencyCode||"INR"}</option>)}</select></div>
            <div className="form-field"><label htmlFor="transfer-to">To account</label><select id="transfer-to" required value={transferForm.toAccountId} onChange={(event)=>setTransferForm((old)=>({...old,toAccountId:event.target.value}))}>{accounts.filter((item)=>item.id!==transferForm.fromAccountId).map((item)=><option key={item.id} value={item.id}>{item.name} · {item.currencyCode||"INR"}</option>)}</select></div>
            <div className="form-grid"><div className="form-field"><label htmlFor="transfer-amount">Transfer amount ({displayCurrencyCode})</label><MoneyInput id="transfer-amount" value={transferForm.amount} onChange={(value)=>setTransferForm((old)=>({...old,amount:value}))} currencyCode={displayCurrencyCode}/></div><div className="form-field"><label htmlFor="transfer-date">Transfer date</label><input id="transfer-date" type="date" required max={getDate()} value={transferForm.date} onChange={(event)=>setTransferForm((old)=>({...old,date:event.target.value}))}/></div></div>
            {accounts.find((item)=>item.id===transferForm.fromAccountId)&&accounts.find((item)=>item.id===transferForm.toAccountId)&&<p className="feature-page-intro">Source account balance: {money(getAccountBalance(accounts.find((item)=>item.id===transferForm.fromAccountId)),accounts.find((item)=>item.id===transferForm.fromAccountId).currencyCode||"INR",1)}. The entered amount is converted into the source and destination account currencies using the cached reference rates.</p>}
            <div className="form-field"><label htmlFor="transfer-note">Note (Optional)</label><textarea id="transfer-note" maxLength={250} value={transferForm.note} onChange={(event)=>setTransferForm((old)=>({...old,note:event.target.value}))}/></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setTransferModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={transferSaving||accounts.length<2}>{transferSaving?"Transferring…":"Record Transfer"}</button></div>
          </form>
        </div>
      )}

      {profilePhotoPreviewOpen && profilePhotoData && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfilePhotoPreviewOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-photo-preview-title">
            <div className="modal-header"><h2 id="profile-photo-preview-title">Profile Photo</h2><button type="button" className="close-button" aria-label="Close photo preview" onClick={() => setProfilePhotoPreviewOpen(false)}>✕</button></div>
            <img className="profile-photo-preview" src={profilePhotoData} alt="Profile photo preview" />
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setProfilePhotoPreviewOpen(false)}>Close</button><button type="button" className="primary-button" onClick={() => { setProfilePhotoPreviewOpen(false); profilePhotoInputRef.current?.click(); }}>Change Photo</button></div>
          </section>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <form className="modal" onSubmit={saveTransaction}>
            <div className="modal-header"><h2>{editingId ? "Edit Transaction" : "Add Transaction"}</h2><button type="button" className="close-button" onClick={() => setModalOpen(false)}>✕</button></div>
            <div className="form-grid">
              <div className="form-field full"><label htmlFor="transaction-title">Transaction Description</label><input id="transaction-title" required maxLength={100} placeholder="e.g. Grocery shopping" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />{suggestedTransactionCategory && suggestedTransactionCategory.name !== form.category && <div className="auto-category-suggestion"><span>Suggested category: <strong>{suggestedTransactionCategory.name}</strong> · {suggestedTransactionCategory.reason}</span><button type="button" className="secondary-button" onClick={() => setForm((old) => ({ ...old, category: suggestedTransactionCategory.name }))}>Apply</button></div>}</div>
              <div className="form-field"><label htmlFor="transaction-type">Transaction Type</label><select id="transaction-type" value={form.type} onChange={(event) => { const nextType = event.target.value; const options = allCategories.filter((item) => item.type === nextType || item.type === "both"); setForm({ ...form, type: nextType, category: options[0]?.name || "Other" }); }}><option value="expense">Expense</option><option value="income">Income</option></select></div>
              <div className="form-field"><label htmlFor="transaction-category">Category</label><select id="transaction-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categoryOptionsForForm.map((item) => <option key={`${item.name}-${item.type}`} value={item.name}>{item.name}</option>)}</select></div>
              <div className="form-field">
                <label htmlFor="transaction-amount">Amount ({displayCurrencyCode} · {displayCurrencySymbol})</label>
                <MoneyInput id="transaction-amount" value={form.amount} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} currencyCode={displayCurrencyCode} />
                <small className="muted"> This transaction will be saved in {displayCurrencyCode}. Existing transactions keep their recorded currency.</small>
              </div>
              <div className="form-field"><label htmlFor="transaction-date">Date</label><input id="transaction-date" required type="date" max={getDate()} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
              <div className="form-field full"><label htmlFor="transaction-account">Payment Account</label><select id="transaction-account" value={form.account} onChange={(event) => setForm({ ...form, account: event.target.value })}>{[...new Set([...accounts.map((item) => item.name), form.account].filter(Boolean))].map((name) => <option key={name} value={name}>{name}</option>)}</select><small className="muted">Manage payment accounts and opening balances from Accounts.</small></div>
              <div className="form-field full"><label htmlFor="transaction-note">Notes (Optional)</label><textarea id="transaction-note" maxLength={500} placeholder="Add a note, reference or extra details..." value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /><small className="muted">{form.note.length}/500 characters</small></div>
            </div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={transactionSaving}>{transactionSaving ? "Saving..." : editingId ? "Save Changes" : "Save Transaction"}</button></div>
          </form>
        </div>
      )}

      {categoryModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryModalOpen(false); }}>
          <form className="modal" onSubmit={saveCategory}>
            <div className="modal-header"><h2>{editingCategory ? "Rename Category" : "Add Category"}</h2><button type="button" className="close-button" onClick={() => setCategoryModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="category-name">Category Name</label><input id="category-name" required maxLength={35} placeholder="e.g. Pet Care" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></div>
            <div className="form-field"><label htmlFor="category-type">Category Type</label><select id="category-type" value={categoryForm.type} disabled={Boolean(editingCategory)} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>{editingCategory && <small className="muted">Category type cannot be changed after creation.</small>}</div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setCategoryModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={categorySaving}>{categorySaving ? "Saving..." : editingCategory ? "Save Changes" : "Add Category"}</button></div>
          </form>
        </div>
      )}

      {goalModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setGoalModalOpen(false); }}>
          <form className="modal" onSubmit={saveGoal}>
            <div className="modal-header"><h2>{editingGoalId ? "Edit Savings Goal" : "Create Savings Goal"}</h2><button type="button" className="close-button" onClick={() => setGoalModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="goal-name">Goal Name</label><input id="goal-name" required maxLength={70} placeholder="e.g. Emergency Fund" value={goalForm.name} onChange={(event) => setGoalForm((old) => ({ ...old, name: event.target.value }))} /></div>
            <div className="form-field"><label htmlFor="goal-target">Target Amount ({displayCurrencyCode} · {displayCurrencySymbol})</label><MoneyInput id="goal-target" value={goalForm.targetAmount} onChange={(value) => setGoalForm((old) => ({ ...old, targetAmount: value }))} currencyCode={displayCurrencyCode} /></div>
            <div className="form-field"><label htmlFor="goal-deadline">Target Date</label><input id="goal-deadline" required type="date" value={goalForm.deadline} onChange={(event) => setGoalForm((old) => ({ ...old, deadline: event.target.value }))} /></div>
            <div className="form-field"><label htmlFor="goal-description">Description (Optional)</label><textarea id="goal-description" maxLength={250} value={goalForm.description} onChange={(event) => setGoalForm((old) => ({ ...old, description: event.target.value }))} placeholder="What are you saving for?" /></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setGoalModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={goalSaving}>{goalSaving ? "Saving..." : "Save Goal"}</button></div>
          </form>
        </div>
      )}

      {contributionModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setContributionModalOpen(false); }}>
          <form className="modal" onSubmit={saveContribution}>
            <div className="modal-header"><h2>Add Savings Contribution</h2><button type="button" className="close-button" onClick={() => setContributionModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="goal-contribution">Contribution Amount ({displayCurrencyCode} · {displayCurrencySymbol})</label><MoneyInput id="goal-contribution" value={contributionAmount} onChange={setContributionAmount} currencyCode={displayCurrencyCode} /></div>
            <p className="feature-page-intro">This updates the goal's progress only. It does not create a bank transaction or change your account balance.</p>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setContributionModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={contributionSaving}>{contributionSaving ? "Adding..." : "Add Contribution"}</button></div>
          </form>
        </div>
      )}

      {recurringModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecurringModalOpen(false); }}>
          <form className="modal" onSubmit={saveRecurring}>
            <div className="modal-header"><h2>{editingRecurringId ? "Edit Recurring Schedule" : "Add Recurring Schedule"}</h2><button type="button" className="close-button" onClick={() => setRecurringModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="recurring-title">Description</label><input id="recurring-title" required maxLength={100} value={recurringForm.title} onChange={(event) => setRecurringForm((old) => ({ ...old, title: event.target.value }))} placeholder="e.g. Monthly rent" /></div>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="recurring-type">Type</label><select id="recurring-type" value={recurringForm.type} onChange={(event) => { const type = event.target.value; const choices = allCategories.filter((item) => item.type === type || item.type === "both"); setRecurringForm((old) => ({ ...old, type, category: choices[0]?.name || "Other" })); }}><option value="expense">Expense</option><option value="income">Income</option></select></div>
              <div className="form-field"><label htmlFor="recurring-category">Category</label><select id="recurring-category" value={recurringForm.category} onChange={(event) => setRecurringForm((old) => ({ ...old, category: event.target.value }))}>{(recurringForm.type === "income" ? incomeCategories : expenseCategories).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
              <div className="form-field"><label htmlFor="recurring-amount">Amount ({displayCurrencyCode} · {displayCurrencySymbol})</label><MoneyInput id="recurring-amount" value={recurringForm.amount} onChange={(value) => setRecurringForm((old) => ({ ...old, amount: value }))} currencyCode={displayCurrencyCode} /></div>
              <div className="form-field"><label htmlFor="recurring-account">Account</label><select id="recurring-account" value={recurringForm.account} onChange={(event) => setRecurringForm((old) => ({ ...old, account: event.target.value }))}><option>UPI</option><option>Bank Account</option><option>Cash</option><option>Card</option><option>Digital Wallet</option></select></div>
              <div className="form-field"><label htmlFor="recurring-frequency">Frequency</label><select id="recurring-frequency" value={recurringForm.frequency} onChange={(event) => setRecurringForm((old) => ({ ...old, frequency: event.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div className="form-field"><label htmlFor="recurring-next-date">First / Next Due Date</label><input id="recurring-next-date" required type="date" value={recurringForm.nextDueDate} onChange={(event) => setRecurringForm((old) => ({ ...old, nextDueDate: event.target.value }))} /></div>
            </div>
            <div className="form-field"><label htmlFor="recurring-note">Note (Optional)</label><textarea id="recurring-note" maxLength={250} value={recurringForm.note} onChange={(event) => setRecurringForm((old) => ({ ...old, note: event.target.value }))} /></div>
            <p className="feature-page-intro">Due occurrences are recorded as transactions the next time FinPilot is open. Use Pause to stop future automatic entries.</p>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setRecurringModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={recurringSaving}>{recurringSaving ? "Saving..." : "Save Schedule"}</button></div>
          </form>
        </div>
      )}

      {billReminderModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBillReminderModalOpen(false); }}>
          <form className="modal" onSubmit={saveBillReminder}>
            <div className="modal-header"><h2>{editingBillReminderId ? "Edit Bill Reminder" : "Add Bill Reminder"}</h2><button type="button" className="close-button" onClick={() => setBillReminderModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="reminder-title">Bill / Payment Name</label><input id="reminder-title" required maxLength={100} placeholder="e.g. Electricity bill" value={billReminderForm.title} onChange={(event) => setBillReminderForm((old) => ({ ...old, title: event.target.value }))} /></div>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="reminder-amount">Expected Amount ({displayCurrencyCode} · {displayCurrencySymbol})</label><MoneyInput id="reminder-amount" value={billReminderForm.amount} onChange={(value) => setBillReminderForm((old) => ({ ...old, amount: value }))} currencyCode={displayCurrencyCode} /></div>
              <div className="form-field"><label htmlFor="reminder-date">Due Date</label><input id="reminder-date" required type="date" value={billReminderForm.dueDate} onChange={(event) => setBillReminderForm((old) => ({ ...old, dueDate: event.target.value }))} /></div>
              <div className="form-field"><label htmlFor="reminder-category">Category</label><select id="reminder-category" value={billReminderForm.category} onChange={(event) => setBillReminderForm((old) => ({ ...old, category: event.target.value }))}>{expenseCategories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
              <div className="form-field"><label htmlFor="reminder-account">Payment Account</label><select id="reminder-account" value={billReminderForm.account} onChange={(event) => setBillReminderForm((old) => ({ ...old, account: event.target.value }))}><option>UPI</option><option>Bank Account</option><option>Cash</option><option>Card</option><option>Digital Wallet</option></select></div>
            </div>
            <div className="form-field"><label htmlFor="reminder-note">Note (Optional)</label><textarea id="reminder-note" maxLength={250} value={billReminderForm.note} onChange={(event) => setBillReminderForm((old) => ({ ...old, note: event.target.value }))} /></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setBillReminderModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={billReminderSaving}>{billReminderSaving ? "Saving..." : "Save Reminder"}</button></div>
          </form>
        </div>
      )}

      {splitModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSplitModalOpen(false);}}>
          <form className="modal" onSubmit={saveSplitExpense}>
            <div className="modal-header"><h2>Split an Expense</h2><button type="button" className="close-button" onClick={()=>setSplitModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="split-title">Expense description</label><input id="split-title" required maxLength={100} value={splitForm.title} onChange={(event)=>setSplitForm((old)=>({...old,title:event.target.value}))} placeholder="e.g. Dinner with friends"/></div>
            <div className="form-grid"><div className="form-field"><label htmlFor="split-amount">Total amount ({displayCurrencyCode})</label><MoneyInput id="split-amount" value={splitForm.amount} onChange={(value)=>setSplitForm((old)=>({...old,amount:value}))} currencyCode={displayCurrencyCode}/></div><div className="form-field"><label htmlFor="split-date">Date</label><input id="split-date" type="date" required value={splitForm.date} onChange={(event)=>setSplitForm((old)=>({...old,date:event.target.value}))}/></div><div className="form-field full"><label htmlFor="split-category">Category</label><select id="split-category" value={splitForm.category} onChange={(event)=>setSplitForm((old)=>({...old,category:event.target.value}))}>{expenseCategories.map((item)=><option key={item.name} value={item.name}>{item.name}</option>)}</select></div></div>
            <div className="form-field"><label htmlFor="split-participants">Other participants (names or Name &lt;email&gt;, one per line)</label><textarea id="split-participants" required maxLength={1500} value={splitForm.participants} onChange={(event)=>setSplitForm((old)=>({...old,participants:event.target.value}))} placeholder={'Asha\nRiya <riya@example.com>'}/></div>
            <p className="feature-page-intro">FinPilot includes you as the payer and divides the total equally. Participant names are stored in your own account; this does not send invitations or transfer money.</p>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setSplitModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={splitSaving}>{splitSaving?"Saving…":"Save Split"}</button></div>
          </form>
        </div>
      )}

      {sharedBudgetModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSharedBudgetModalOpen(false);}}>
          <form className="modal" onSubmit={saveSharedBudget}>
            <div className="modal-header"><h2>Create Shared Budget</h2><button type="button" className="close-button" onClick={()=>setSharedBudgetModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="shared-budget-name">Budget name</label><input id="shared-budget-name" required maxLength={80} value={sharedBudgetForm.name} onChange={(event)=>setSharedBudgetForm((old)=>({...old,name:event.target.value}))} placeholder="e.g. Flat expenses"/></div>
            <div className="form-field"><label htmlFor="shared-budget-limit">Monthly limit ({displayCurrencyCode})</label><MoneyInput id="shared-budget-limit" value={sharedBudgetForm.monthlyLimit} onChange={(value)=>setSharedBudgetForm((old)=>({...old,monthlyLimit:value}))} currencyCode={displayCurrencyCode}/></div>
            <div className="form-field"><label htmlFor="shared-budget-members">Invite registered FinPilot email addresses</label><textarea id="shared-budget-members" value={sharedBudgetForm.memberEmails} onChange={(event)=>setSharedBudgetForm((old)=>({...old,memberEmails:event.target.value}))} placeholder={'friend@example.com\nroommate@example.com'}/></div>
            <div className="form-field"><label htmlFor="shared-budget-description">Description (Optional)</label><textarea id="shared-budget-description" maxLength={250} value={sharedBudgetForm.description} onChange={(event)=>setSharedBudgetForm((old)=>({...old,description:event.target.value}))}/></div>
            <p className="feature-page-intro">Invited people must already have a verified FinPilot account using the exact email address entered above. They can view the shared budget and add expenses. This requires publishing the included Firestore rules.</p>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setSharedBudgetModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={sharedBudgetSaving}>{sharedBudgetSaving?"Creating…":"Create Shared Budget"}</button></div>
          </form>
        </div>
      )}

      {sharedExpenseModalOpen && selectedSharedBudget && (
        <div className="modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSharedExpenseModalOpen(false);}}>
          <form className="modal" onSubmit={addSharedBudgetExpense}>
            <div className="modal-header"><h2>Add Shared Expense</h2><button type="button" className="close-button" onClick={()=>setSharedExpenseModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="shared-expense-title">Description</label><input id="shared-expense-title" required maxLength={100} value={sharedExpenseForm.title} onChange={(event)=>setSharedExpenseForm((old)=>({...old,title:event.target.value}))} placeholder="e.g. Electricity bill"/></div>
            <div className="form-grid"><div className="form-field"><label htmlFor="shared-expense-amount">Amount ({displayCurrencyCode})</label><MoneyInput id="shared-expense-amount" value={sharedExpenseForm.amount} onChange={(value)=>setSharedExpenseForm((old)=>({...old,amount:value}))} currencyCode={displayCurrencyCode}/></div><div className="form-field"><label htmlFor="shared-expense-date">Date</label><input id="shared-expense-date" type="date" required value={sharedExpenseForm.date} onChange={(event)=>setSharedExpenseForm((old)=>({...old,date:event.target.value}))}/></div><div className="form-field full"><label htmlFor="shared-expense-category">Category</label><select id="shared-expense-category" value={sharedExpenseForm.category} onChange={(event)=>setSharedExpenseForm((old)=>({...old,category:event.target.value}))}>{expenseCategories.map((item)=><option key={item.name} value={item.name}>{item.name}</option>)}</select></div></div>
            <div className="form-field"><label htmlFor="shared-expense-note">Note (Optional)</label><textarea id="shared-expense-note" maxLength={250} value={sharedExpenseForm.note} onChange={(event)=>setSharedExpenseForm((old)=>({...old,note:event.target.value}))}/></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setSharedExpenseModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={sharedExpenseSaving}>{sharedExpenseSaving?"Adding…":"Add Expense"}</button></div>
          </form>
        </div>
      )}

      {budgetModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBudgetModalOpen(false); }}>
          <form className="modal" noValidate onSubmit={saveBudget}>
            <div className="modal-header"><h2>Set Monthly Budget</h2><button type="button" className="close-button" onClick={() => setBudgetModalOpen(false)}>✕</button></div>
            <div className="form-field"><label htmlFor="monthly-budget">Monthly spending limit ({displayCurrencyCode} · {displayCurrencySymbol})</label><MoneyInput id="monthly-budget" value={monthlyBudgetDraft} onChange={setMonthlyBudgetDraft} currencyCode={displayCurrencyCode} /></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setBudgetModalOpen(false)}>Cancel</button><button type="submit" className="primary-button">Save Budget</button></div>
          </form>
        </div>
      )}
    </>
  );
}

function MoneyInput({ id, value, onChange, currencyCode = "INR", ariaLabel, compact = false }) {
  const currentText = String(value ?? "");
  const changeBy = (difference) => {
    const parsed = currentText.trim() === "" ? 100 : Number(currentText);
    const base = Number.isFinite(parsed) ? parsed : 100;
    const next = Math.max(0.01, base + difference);
    onChange(Number(next.toFixed(2)).toString());
  };

  return (
    <div className={`amount-control${compact ? " money-input-compact" : ""}`}>
      <input
        id={id}
        required
        type="text"
        inputMode="decimal"
        autoComplete="off"
        maxLength={16}
        placeholder="100.00"
        aria-label={ariaLabel || `Amount in ${currencyCode}`}
        value={currentText}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (/^\d*\.?\d{0,2}$/.test(nextValue)) onChange(nextValue);
        }}
      />
      <div className="amount-stepper" aria-label={`Adjust amount in ${currencyCode}`}>
        <button type="button" title={`Increase by ${currencyCode} 500`} aria-label={`Increase amount by ${currencyCode} 500`} onClick={() => changeBy(500)}>▲</button>
        <button type="button" title={`Decrease by ${currencyCode} 500`} aria-label={`Decrease amount by ${currencyCode} 500`} onClick={() => changeBy(-500)}>▼</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, color, foot }) {
  return <div className="stat-card" style={{ "--stat-accent": color || "#7667E8", "--stat-tint": iconBg || "#EFEDFF" }}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon" style={{ background: iconBg, color }}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>;
}

export default App;
