import React, { useState } from 'react';
import { 
  Shield, 
  Zap, 
  Crown,
  Star,
  CheckCircle,
  XCircle,
  Settings,
  HeartPulse
} from 'lucide-react';
import { 
  SiGooglecalendar, 
  SiGmail, 
  SiSlack,
  SiStripe
} from 'react-icons/si';
import { FaGoogleDrive, FaSpotify, FaFigma, FaMicrosoft } from 'react-icons/fa';
import './permissions.css';

interface Service {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  premium: boolean;
  icon: React.ComponentType<any>;
}

const Permissions: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    { 
      id: 'google_calendar', 
      name: 'Google Calendar', 
      description: 'Access your calendar to schedule tasks', 
      connected: true, 
      premium: false,
      icon: SiGooglecalendar
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      description: 'Sync with your team communications', 
      connected: true, 
      premium: true,
      icon: SiSlack
    },
    { 
      id: 'gmail', 
      name: 'Gmail', 
      description: 'Read emails to help manage communication', 
      connected: false, 
      premium: false,
      icon: SiGmail
    },
    { 
      id: 'outlook', 
      name: 'Microsoft Outlook', 
      description: 'Sync with Outlook calendar and mail', 
      connected: false, 
      premium: true,
      icon: FaMicrosoft
    },
    { 
      id: 'drive', 
      name: 'Google Drive', 
      description: 'Access your documents and files', 
      connected: false, 
      premium: true,
      icon: FaGoogleDrive
    },
    { 
      id: 'spotify', 
      name: 'Spotify', 
      description: 'Sync your music preferences and playlists', 
      connected: false, 
      premium: true,
      icon: FaSpotify
    },
    { 
      id: 'figma', 
      name: 'Figma', 
      description: 'Connect with your design projects', 
      connected: false, 
      premium: true,
      icon: FaFigma
    }
  ]);

  const toggleService = (id: string) => {
    setServices(prev =>
      prev.map(service => 
        service.id === id ? { ...service, connected: !service.connected } : service
      )
    );
  };

  const premiumFeatures = [
    'Unlimited AI Actions',
    'Advanced Well-being Insights',
    'Connect Unlimited Apps',
    'Priority Support',
    'Custom Integration Tools',
    'Advanced Analytics Dashboard'
  ];

  return (
    <div className="permissions-page">
      <header className="permissions-header">
        <div className="header-content">
          <Shield className="header-icon" size={32} />
          <div>
            <h1>Integrations & Permissions</h1>
            <p className="subtitle">Manage your connected services and access levels</p>
          </div>
        </div>
      </header>

      <div className="permissions-layout">
        <div className="cyber-card services-column">
          <div className="card-header">
            <Settings className="card-icon" size={24} />
            <h2>Connected Services</h2>
            <div className="cyber-border"></div>
          </div>
          
          <div className="card-content">
            <div className="services-list">
              {services.map(service => {
                const IconComponent = service.icon;
                return (
                  <div key={service.id} className="service-item">
                    <div className="service-info">
                      <div className="service-icon">
                        <IconComponent size={20} />
                      </div>
                      <div className="service-details">
                        <span className="service-name">{service.name}</span>
                        <span className="service-desc">{service.description}</span>
                        {service.premium && (
                          <div className="premium-tag">
                            <Crown size={12} />
                            <span>Premium Feature</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="service-controls">
                      {service.connected ? (
                        <div className="connection-status connected">
                          <CheckCircle size={16} />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <div className="connection-status disconnected">
                          <XCircle size={16} />
                          <span>Not Connected</span>
                        </div>
                      )}
                      
                      <button 
                        className={`connect-button ${service.connected ? 'disconnect' : 'connect'} ${service.premium && !service.connected ? 'premium-locked' : ''}`}
                        onClick={() => toggleService(service.id)}
                        disabled={service.premium && !service.connected}
                      >
                        {service.premium && !service.connected ? (
                          <>
                            <Crown size={14} />
                            Upgrade Required
                          </>
                        ) : service.connected ? (
                          'Disconnect'
                        ) : (
                          'Connect'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="card-footer">
            <span className="footer-text">
              {services.filter(s => s.connected).length} of {services.length} services connected
            </span>
          </div>
        </div>

        <div className="cyber-card premium-column">
          <div className="card-header">
            <Crown className="card-icon" size={24} />
            <h2>Subscription Plan</h2>
            <div className="cyber-border"></div>
          </div>
          
          <div className="card-content">
            <div className="plan-current">
              <div className="plan-header">
                <span className="plan-name">Current Plan</span>
                <span className="plan-tier free">Free Tier</span>
              </div>
              <p className="plan-description">
                Basic features with limited integrations. Upgrade to unlock premium services.
              </p>
              
              <div className="plan-limits">
                <div className="limit-item">
                  <span className="limit-label">Available Integrations:</span>
                  <span className="limit-value">3 of 8</span>
                </div>
                <div className="limit-bar">
                  <div className="limit-fill" style={{ width: '37.5%' }}></div>
                </div>
              </div>
            </div>

            <div className="premium-features">
              <h3>Premium Plan Includes:</h3>
              <ul className="features-list">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <Star className="feature-icon" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="upgrade-section">
              <div className="price">
                <span className="amount">R149.99</span>
                <span className="period">/month</span>
              </div>
              <button className="upgrade-button">
                <Zap size={16} />
                Upgrade to Premium
              </button>
              <div className="billing-info">
                <SiStripe size={20} />
                <p className="billing-note">
                  Subscription billing managed securely via Stripe
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-footer">
            <span className="footer-text">Unlock all 8+ integrations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Permissions;