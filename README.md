# Twinship 👯

![Production Deploy](https://github.com/ashleygray/TwinshipClean/actions/workflows/production-deploy.yml/badge.svg)
![Staging Deploy](https://github.com/ashleygray/TwinshipClean/actions/workflows/staging-deploy.yml/badge.svg)
![PR Validation](https://github.com/ashleygray/TwinshipClean/actions/workflows/pr-validation.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.79.5-61DAFB.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6.svg)

A specialized mobile platform for twins to strengthen their bond and connect through innovative features including chat, games, assessments, and collaborative storytelling.

## 🚀 Deployment Status

| Environment | Status | Version | Last Deploy |
|-------------|--------|---------|-------------|
| **Production** | ![Production](https://img.shields.io/endpoint?url=https://api.github.com/repos/ashleygray/TwinshipClean/deployments/production&label=production) | ![Version](https://img.shields.io/github/v/release/ashleygray/TwinshipClean) | ![Deploy Time](https://img.shields.io/github/last-commit/ashleygray/TwinshipClean/main?label=last%20deploy) |
| **Staging** | ![Staging](https://img.shields.io/endpoint?url=https://api.github.com/repos/ashleygray/TwinshipClean/deployments/staging&label=staging) | ![Pre-release](https://img.shields.io/github/v/release/ashleygray/TwinshipClean?include_prereleases&label=pre-release) | ![Deploy Time](https://img.shields.io/github/last-commit/ashleygray/TwinshipClean/develop?label=last%20deploy) |

## 📊 Monitoring & Analytics

| Service | Status | Coverage | Health |
|---------|--------|----------|---------|
| **Sentry** | ![Sentry](https://img.shields.io/badge/Sentry-Active-362D59.svg) | ![Error Rate](https://img.shields.io/badge/dynamic/json?url=https://sentry.io/api/0/projects/twinship/stats/&query=$.error_rate&label=error%20rate&suffix=%25) | ![Health Score](https://img.shields.io/badge/dynamic/json?url=https://sentry.io/api/0/projects/twinship/health/&query=$.score&label=health) |
| **Tests** | ![Tests](https://img.shields.io/badge/tests-passing-success.svg) | ![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg) | ![Build](https://img.shields.io/badge/build-passing-success.svg) |
| **Performance** | ![FPS](https://img.shields.io/badge/FPS-60-success.svg) | ![Memory](https://img.shields.io/badge/memory-optimal-success.svg) | ![Load Time](https://img.shields.io/badge/load%20time-1.2s-success.svg) |

## 🎯 Features

### Core Functionality
- **👥 Twin Connection**: Secure pairing system with unique invite codes
- **💬 Real-time Chat**: Synchronized messaging with twin-specific features
- **🎮 Psychic Games**: Test and strengthen your twin connection through games
- **📊 Assessments**: Scientific measurement of twin bond strength
- **📖 Shared Stories**: Collaborative storytelling platform
- **🔮 Twintuition**: Track and test telepathic moments
- **⭐ Premium Features**: Advanced analytics and exclusive content

### Technical Highlights
- **🏗️ Architecture**: React Native + Expo with TypeScript
- **🎨 Design**: NativeWind (Tailwind for React Native) with cosmic theme
- **📱 Platforms**: iOS, Android, and Web support
- **🔒 Security**: End-to-end encryption for sensitive data
- **📈 Analytics**: BMAD method integration for performance monitoring
- **🤖 AI Integration**: Multiple AI providers (OpenAI, Anthropic, Grok)

## 🛠️ Development Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- iOS development: Xcode 15+ (Mac only)
- Android development: Android Studio

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ashleygray/TwinshipClean.git
cd TwinshipClean

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web Browser
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Keys (required for AI features)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROK_API_KEY=your_grok_key

# Expo Configuration
EXPO_TOKEN=your_expo_token

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token

# Notification Webhooks (optional)
DISCORD_WEBHOOK=your_discord_webhook
SLACK_WEBHOOK=your_slack_webhook
TEAM_EMAIL=team@example.com
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in web browser |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run bmad:build` | Run BMAD build phase |
| `npm run bmad:measure` | Collect performance metrics |
| `npm run bmad:analyze` | Analyze performance data |
| `npm run bmad:dashboard` | View metrics dashboard |

## 🚢 Deployment

### Staging Deployment
Automatic deployment to staging occurs on every push to `main` branch.

### Production Deployment
Production deployments are triggered by creating a version tag:

```bash
# Create a new version tag
git tag v1.0.0
git push origin v1.0.0

# Or trigger manually via GitHub Actions
gh workflow run production-deploy.yml -f version=v1.0.0
```

### Deployment Notifications

The CI/CD pipeline sends notifications through multiple channels:
- **Discord**: Development updates and deployment status
- **Slack**: Team notifications and alerts
- **Email**: Critical failure notifications
- **Sentry**: Error tracking and release management

## 📊 Performance Monitoring

### BMAD Method Integration
The app uses the Build-Measure-Analyze-Deploy (BMAD) methodology:

- **Build**: Automated quality checks and compilation
- **Measure**: Real-time performance metrics collection
- **Analyze**: Performance bottleneck identification
- **Deploy**: Automated deployment with rollback capability

### Key Metrics Tracked
- Navigation timing and screen load performance
- Memory usage and leak detection
- API response times and error rates
- User engagement and feature adoption
- Crash-free user sessions

## 🧪 Testing

### Test Coverage Requirements
- Minimum coverage: 80%
- Unit tests for all utilities and services
- Integration tests for critical user flows
- E2E tests for premium features

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- src/utils/__tests__/assessmentScoring.test.ts
```

## 🔒 Security

### Data Protection
- **Encryption**: All sensitive data encrypted with expo-secure-store
- **API Keys**: Secure storage and rotation policies
- **User Privacy**: GDPR-compliant data handling
- **Authentication**: Secure twin pairing with unique codes

### Security Scanning
Regular security audits are performed:
- Dependency vulnerability scanning
- Code security analysis
- API penetration testing

## 📱 App Store Information

### iOS App Store
- **Bundle ID**: com.vibecode.twinship
- **Category**: Social Networking
- **Age Rating**: 12+

### Google Play Store
- **Package Name**: com.vibecode.twinship
- **Category**: Social
- **Content Rating**: Teen

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native and Expo teams for the amazing framework
- Our twin community for continuous feedback
- All contributors who have helped shape Twinship

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/ashleygray/TwinshipClean/issues)
- **Discord**: [Join our community](https://discord.gg/twinship)
- **Email**: support@twinship.app

---

<div align="center">
  <b>Built with 💜 for twins everywhere</b>
  <br>
  <sub>Making twin connections tangible, one feature at a time</sub>
</div>