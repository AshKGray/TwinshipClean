/**
 * Preload Manager - Handles intelligent preloading of lazy components
 */

interface PreloadableComponent {
  preload?: () => Promise<any>;
}

class PreloadManager {
  private preloadedComponents = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload a component if it hasn't been preloaded already
   */
  async preloadComponent(
    componentName: string,
    component: PreloadableComponent
  ): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    if (!component.preload) {
      console.log(`Component ${componentName} does not support preloading`);
      return;
    }

    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    console.log(`[PreloadManager] Preloading ${componentName}...`);
    
    const preloadPromise = component
      .preload()
      .then(() => {
        this.preloadedComponents.add(componentName);
        console.log(`[PreloadManager] Successfully preloaded ${componentName}`);
      })
      .catch((error) => {
        console.log(`[PreloadManager] Preloading ${componentName} in progress...`, error);
      })
      .finally(() => {
        this.preloadPromises.delete(componentName);
      });

    this.preloadPromises.set(componentName, preloadPromise);
    return preloadPromise;
  }

  /**
   * Preload multiple components in parallel
   */
  async preloadComponents(
    components: Array<{ name: string; component: PreloadableComponent }>
  ): Promise<void> {
    const preloadPromises = components.map(({ name, component }) =>
      this.preloadComponent(name, component)
    );

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.log('[PreloadManager] Some components are still preloading...', error);
    }
  }

  /**
   * Check if a component has been preloaded
   */
  isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  /**
   * Get preload status for debugging
   */
  getStatus(): { preloaded: string[]; inProgress: string[] } {
    return {
      preloaded: Array.from(this.preloadedComponents),
      inProgress: Array.from(this.preloadPromises.keys())
    };
  }

  /**
   * Preload based on user navigation patterns
   */
  smartPreload(currentScreen: string): void {
    const preloadStrategies: Record<string, string[]> = {
      'HomeScreen': ['TwinGamesHub', 'AssessmentIntroScreen'],
      'TwinGamesHub': [
        'CognitiveSyncMaze', 
        'EmotionalResonanceMapping',
        'IconicDuoMatcher',
        'TemporalDecisionSync'
      ],
      'AssessmentIntroScreen': ['AssessmentSurveyScreen'],
      'AssessmentSurveyScreen': ['AssessmentLoadingScreen'],
      'AssessmentLoadingScreen': ['AssessmentResultsScreen']
    };

    const componentsToPreload = preloadStrategies[currentScreen];
    if (componentsToPreload) {
      console.log(`[PreloadManager] Smart preloading for ${currentScreen}: ${componentsToPreload.join(', ')}`);
      // Note: This would need component references to actually preload
      // For now, it serves as a strategy framework
    }
  }
}

export const preloadManager = new PreloadManager();
export default preloadManager;