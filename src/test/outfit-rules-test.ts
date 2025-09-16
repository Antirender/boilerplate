// Test the outfit advice rules with sample weather data
import { generateOutfitAdvice, sliceNextHours } from '../logic/rules';
import type { Hour } from '../logic/types';

// Sample weather data for testing
const testScenarios = [
  {
    name: "Hot Summer Day",
    hours: Array(6).fill(null).map((_, i) => ({
      isoTime: new Date(Date.now() + i * 3600000).toISOString(),
      temp: 32,
      apparent: 35,
      pop: 10,
      precip: 0,
      wind: 15,
      uv: 9
    })) as Hour[]
  },
  {
    name: "Cold Winter Day",
    hours: Array(6).fill(null).map((_, i) => ({
      isoTime: new Date(Date.now() + i * 3600000).toISOString(),
      temp: -5,
      apparent: -10,
      pop: 20,
      precip: 0,
      wind: 25,
      uv: 2
    })) as Hour[]
  },
  {
    name: "Rainy Day",
    hours: Array(6).fill(null).map((_, i) => ({
      isoTime: new Date(Date.now() + i * 3600000).toISOString(),
      temp: 18,
      apparent: 16,
      pop: 85,
      precip: 3,
      wind: 20,
      uv: 3
    })) as Hour[]
  }
];

console.log('🌤️ Testing Outfit Advice Rules\n');

testScenarios.forEach(scenario => {
  console.log(`\n📍 ${scenario.name}:`);
  const { stats } = sliceNextHours(scenario.hours, 6);
  const advice = generateOutfitAdvice(stats);
  
  console.log(`   Weather Stats: ${stats.minApparent}°-${stats.maxApparent}°, ${stats.maxPOP}% rain, UV ${stats.maxUV}, Wind ${stats.maxWind}km/h`);
  console.log('   Recommendations:');
  
  advice.forEach(item => {
    console.log(`   ${item.icon} ${item.message} (${item.severity} priority)`);
  });
});

export {};
