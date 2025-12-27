export const processInput = async (items: string[]) => {
  // Mock processing logic
  // In a real app, this might call an AI service
  const title = items.length > 0 ? items[0] : "Untitled";
  
  const menuItems = items.map((item, index) => ({
    id: index + 1,
    name: item,
    calories: Math.floor(Math.random() * 500) + 50 // Mock data
  }));

  const formatted_menu = items.join('\n');
  const raw_json = JSON.stringify({
    items: menuItems,
    timestamp: new Date().toISOString()
  });

  return {
    title,
    formatted_menu,
    raw_json
  };
};
