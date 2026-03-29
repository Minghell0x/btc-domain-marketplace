import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletConnectProvider } from '@btc-vision/walletconnect';
import { WalletProvider } from './contexts/WalletContext';
import { ContractProvider } from './contexts/ContractContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Explore } from './pages/Explore';
import { DomainDetail } from './pages/DomainDetail';
import { ListDomain } from './pages/ListDomain';
import { RegisterDomain } from './pages/RegisterDomain';
import { MyListings } from './pages/MyListings';
import { MyActivity } from './pages/MyActivity';
import { Activity } from './pages/Activity';

export default function App(): ReactElement {
    return (
        <BrowserRouter>
            <WalletConnectProvider theme="dark">
                <WalletProvider>
                    <ContractProvider>
                        <TransactionProvider>
                            <div className="flex flex-col min-h-screen">
                                <Navbar />
                                <Routes>
                                    <Route path="/" element={<Explore />} />
                                    <Route path="/domain/:name" element={<DomainDetail />} />
                                    <Route path="/list" element={<ListDomain />} />
                                    <Route path="/register" element={<RegisterDomain />} />
                                    <Route path="/my/listings" element={<MyListings />} />
                                    <Route path="/my/activity" element={<MyActivity />} />
                                    <Route path="/activity" element={<Activity />} />
                                </Routes>
                                <Footer />
                            </div>
                        </TransactionProvider>
                    </ContractProvider>
                </WalletProvider>
            </WalletConnectProvider>
        </BrowserRouter>
    );
}
