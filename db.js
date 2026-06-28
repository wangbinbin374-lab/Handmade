/**
 * Handmade DB Module - IndexedDB Wrapper
 * Provides persistence for recipes, bakes diary, ingredient prices, and settings.
 */

const DB_NAME = 'HandmadeDB';
const DB_VERSION = 1;

let dbInstance = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database opening error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Recipes store
      if (!db.objectStoreNames.contains('recipes')) {
        db.createObjectStore('recipes', { keyPath: 'id' });
      }

      // Bakes (Diary logs) store
      if (!db.objectStoreNames.contains('bakes')) {
        db.createObjectStore('bakes', { keyPath: 'id' });
      }

      // Ingredient price inventory
      if (!db.objectStoreNames.contains('ingredients')) {
        db.createObjectStore('ingredients', { keyPath: 'id' });
      }

      // App settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generic operations helper
 */
function requestPromise(storeName, mode, callback) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      
      const request = callback(store);
      
      transaction.oncomplete = () => {
        resolve(request.result);
      };
      
      transaction.onerror = (event) => {
        console.error(`Transaction error in store ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      if (request) {
        request.onerror = (event) => {
          reject(event.target.error);
        };
      }
    });
  });
}

const HandmadeDB = {
  // --- RECIPES API ---
  getRecipes() {
    return requestPromise('recipes', 'readonly', (store) => store.getAll())
      .then((recipes) => recipes.sort((a, b) => b.createdAt - a.createdAt));
  },

  getRecipe(id) {
    return requestPromise('recipes', 'readonly', (store) => store.get(id));
  },

  saveRecipe(recipe) {
    if (!recipe.id) {
      recipe.id = 'recipe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      recipe.createdAt = Date.now();
    }
    return requestPromise('recipes', 'readwrite', (store) => store.put(recipe))
      .then(() => recipe);
  },

  deleteRecipe(id) {
    return requestPromise('recipes', 'readwrite', (store) => store.delete(id));
  },

  // --- BAKES (DIARY) API ---
  getBakes() {
    return requestPromise('bakes', 'readonly', (store) => store.getAll())
      .then((bakes) => bakes.sort((a, b) => new Date(b.date) - new Date(a.date)));
  },

  getBake(id) {
    return requestPromise('bakes', 'readonly', (store) => store.get(id));
  },

  saveBake(bake) {
    if (!bake.id) {
      bake.id = 'bake_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return requestPromise('bakes', 'readwrite', (store) => store.put(bake))
      .then(() => bake);
  },

  deleteBake(id) {
    return requestPromise('bakes', 'readwrite', (store) => store.delete(id));
  },

  // --- INGREDIENTS PRICING API ---
  getIngredients() {
    return requestPromise('ingredients', 'readonly', (store) => store.getAll());
  },

  saveIngredient(ingredient) {
    return requestPromise('ingredients', 'readwrite', (store) => store.put(ingredient));
  },

  saveIngredientsBatch(ingredientsList) {
    return getDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('ingredients', 'readwrite');
        const store = transaction.objectStore('ingredients');
        
        ingredientsList.forEach((item) => {
          store.put(item);
        });

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = (event) => reject(event.target.error);
      });
    });
  },

  // --- SETTINGS API ---
  getSetting(id, defaultValue) {
    return requestPromise('settings', 'readonly', (store) => store.get(id))
      .then((setting) => (setting ? setting.value : defaultValue))
      .catch(() => defaultValue);
  },

  saveSetting(id, value) {
    return requestPromise('settings', 'readwrite', (store) => store.put({ id, value }));
  },

  // --- DATABASE RESET / BACKUP ---
  clearAllData() {
    return getDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes', 'bakes', 'ingredients', 'settings'], 'readwrite');
        
        transaction.objectStore('recipes').clear();
        transaction.objectStore('bakes').clear();
        transaction.objectStore('ingredients').clear();
        transaction.objectStore('settings').clear();

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = (event) => reject(event.target.error);
      });
    });
  },

  exportBackup() {
    return Promise.all([
      this.getRecipes(),
      this.getBakes(),
      this.getIngredients(),
      requestPromise('settings', 'readonly', (store) => store.getAll())
    ]).then(([recipes, bakes, ingredients, settings]) => {
      return JSON.stringify({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        recipes,
        bakes,
        ingredients,
        settings
      }, null, 2);
    });
  },

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.recipes || !data.bakes || !data.ingredients) {
        throw new Error('无效的备份数据格式');
      }

      return getDB().then((db) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(['recipes', 'bakes', 'ingredients', 'settings'], 'readwrite');
          
          // Clear current
          transaction.objectStore('recipes').clear();
          transaction.objectStore('bakes').clear();
          transaction.objectStore('ingredients').clear();
          transaction.objectStore('settings').clear();

          // Load imported
          const recipeStore = transaction.objectStore('recipes');
          data.recipes.forEach((r) => recipeStore.put(r));

          const bakeStore = transaction.objectStore('bakes');
          data.bakes.forEach((b) => bakeStore.put(b));

          const ingredientStore = transaction.objectStore('ingredients');
          data.ingredients.forEach((i) => ingredientStore.put(i));

          if (data.settings && Array.isArray(data.settings)) {
            const settingsStore = transaction.objectStore('settings');
            data.settings.forEach((s) => settingsStore.put(s));
          }

          transaction.oncomplete = () => resolve(true);
          transaction.onerror = (event) => reject(event.target.error);
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
window.HandmadeDB = HandmadeDB;
