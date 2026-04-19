import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteEntry, getEntries } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Entry = {
  id: number;
  title: string;
  formatted_menu: string;
  raw_json: string;
  total_calories?: number;
  total_macros?: string; // JSON string
  date?: string;
};

type DaySection = {
  title: string;
  date: Date;
  totalCalories: number;
  totalMacros: { carbohydrates: number; protein: number; fat: number };
  data: Entry[];
};

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [sections, setSections] = useState<DaySection[]>([]);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchEntries = async () => {
    try {
      const data = await getEntries();
      const grouped = groupEntriesByDay(data);
      setSections(grouped);
    } catch (error) {
      console.error("Failed to fetch entries", error);
    }
  };

  useFocusEffect(
      useCallback(() => {
        fetchEntries();
        return () => {};
      }, [])
  );

  const groupEntriesByDay = (entries: Entry[]): DaySection[] => {
    const groups: { [key: string]: DaySection } = {};

    entries.forEach(entry => {
      const dateStr = entry.date || new Date().toISOString();
      const date = parseISO(dateStr);
      const dayKey = format(date, 'yyyy-MM-dd');

      if (!groups[dayKey]) {
        groups[dayKey] = {
          title: format(date, 'EEEE, MMM d'),
          date: date,
          totalCalories: 0,
          totalMacros: { carbohydrates: 0, protein: 0, fat: 0 },
          data: []
        };
      }
      
      groups[dayKey].data.push(entry);
      groups[dayKey].totalCalories += (entry.total_calories || 0);
      
      if (entry.total_macros) {
        try {
          const m = JSON.parse(entry.total_macros);
          groups[dayKey].totalMacros.carbohydrates += (m.carbohydrates || 0);
          groups[dayKey].totalMacros.protein += (m.protein || 0);
          groups[dayKey].totalMacros.fat += (m.fat || 0);
        } catch (e) {}
      }
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const handleDelete = (id: number) => {
    Alert.alert(
        "Delete Entry",
        "Are you sure?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                   await deleteEntry(id);
                   fetchEntries();
                }
            }
        ]
    );
  };

  const renderSectionHeader = ({ section: { title, totalCalories, totalMacros } }: { section: DaySection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.sectionMacroSummary, { color: theme.subtext }]}>
          C: {Math.round(totalMacros.carbohydrates)}g • P: {Math.round(totalMacros.protein)}g • F: {Math.round(totalMacros.fat)}g
        </Text>
      </View>
      <Text style={[styles.sectionCalories, { color: theme.success }]}>{totalCalories} cal</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Entry }) => {
    let macrosText = "";
    if (item.total_macros) {
      try {
        const m = JSON.parse(item.total_macros);
        macrosText = `C: ${m.carbohydrates}g, P: ${m.protein}g, F: ${m.fat}g`;
      } catch (e) {}
    }

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: theme.card, borderColor: theme.border }]} 
        onPress={() => router.push(`/details/${item.id}`)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
            <Text numberOfLines={1} style={[styles.itemMacros, { color: theme.tint, fontWeight: '500' }]}>
                {macrosText}
            </Text>
            <Text numberOfLines={2} style={[styles.itemSnippet, { color: theme.subtext }]}>
                {item.formatted_menu}
            </Text>
        </View>
        <View style={styles.itemMeta}>
           <Text style={[styles.itemCalories, { color: theme.text }]}>{item.total_calories || 0} cal</Text>
           <Ionicons name="chevron-forward" size={16} color={theme.icon} />
        </View>
      </TouchableOpacity>
    );
  };


    // Calendar Components
  const CalendarStrip = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Track the currently viewed month separately from selectedDate
    // so user can browse months without losing selection
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Sync current month with selected date when not expanded (or initially)
    useEffect(() => {
        if (!isExpanded) {
            setCurrentMonth(selectedDate);
        }
    }, [selectedDate, isExpanded]);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Better month navigation
    const handlePrevMonth = (e: any) => {
        e.stopPropagation();
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = (e: any) => {
        e.stopPropagation();
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const renderDays = () => {
        let days = [];
        
        if (isExpanded) {
            // Full Month View
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
            
            days = eachDayOfInterval({ start: startDate, end: endDate });
        } else {
            // Week View (centered on selectedDate or currentMonth)
            const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
            days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
        }

        return days.map((day, index) => {
             const isSelected = isSameDay(day, selectedDate);
             const isToday = isSameDay(day, new Date());
             const hasData = sections.some(s => isSameDay(s.date, day));
             const isCurrentMonth = isSameDay(day, currentMonth) || (day.getMonth() === currentMonth.getMonth());

             return (
                 <TouchableOpacity 
                     key={day.toISOString()} 
                     style={[styles.dayCol, isExpanded && styles.dayColExpanded]}
                     onPress={() => setSelectedDate(day)}
                 >
                     <Text style={[
                         styles.dayName, 
                         isSelected && styles.selectedDayText,
                         !isCurrentMonth && isExpanded && styles.dimmedText // Dim days outside current month
                     ]}>
                         {format(day, 'EEE')}
                     </Text>
                     <View style={[
                         styles.dayNumContainer, 
                         isSelected && styles.selectedDayNumContainer,
                         !isSelected && isToday && styles.todayNumContainer
                     ]}>
                         <Text style={[
                             styles.dayNum, 
                             isSelected && styles.selectedDayNum,
                             !isSelected && isToday && styles.todayNumText,
                             !isCurrentMonth && isExpanded && styles.dimmedText
                         ]}>
                             {format(day, 'd')}
                         </Text>
                     </View>
                     {/* Simple dot if we have data for this day */}
                     {hasData && (
                         <View style={[styles.hasDataDot, isSelected && { backgroundColor: '#000' }]} />
                     )}
                 </TouchableOpacity>
             );
        });
    };

    return (
        <View style={[styles.calendarContainer, { backgroundColor: theme.calendarBackground }]}>
            <TouchableOpacity onPress={toggleExpand} style={styles.monthHeaderContainer}>
                <View style={styles.monthHeader}>
                    {isExpanded && (
                        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTextContainer}>
                         <Text style={[styles.monthText, { color: theme.icon }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
                         <Ionicons 
                            name={isExpanded ? "chevron-down" : "chevron-up"} 
                            size={16} 
                            color={theme.icon} 
                            style={{ marginLeft: 5 }}
                         />
                    </View>
                    {isExpanded && (
                        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            <View style={[styles.daysRow, isExpanded && styles.daysRowExpanded]}>
                {!isExpanded && (
                    <View style={styles.weekNumber}>
                        <Text style={[styles.weekNumText, { color: theme.icon }]}>W{format(selectedDate, 'w')}</Text>
                    </View>
                )}
                {renderDays()}
            </View>
        </View>
    );
  };

  const filteredSections = sections.filter(section => isSameDay(section.date, selectedDate));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>No entries for {format(selectedDate, 'MMM d')}</Text>
            </View>
        }
      />
      
      <CalendarStrip />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
    minHeight: 300, 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  sectionMacroSummary: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Fonts.mono,
    opacity: 0.8,
  },
  sectionCalories: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Fonts.sans,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    elevation: 2,
  },
  itemContent: {
      flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Fonts.serif,
  },
  itemMacros: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: Fonts.mono,
  },
  itemSnippet: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    opacity: 0.8,
  },

  itemMeta: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: 10,
  },
  itemCalories: {
      fontSize: 15,
      fontWeight: 'bold',
      marginBottom: 4,
      fontFamily: Fonts.sans,
  },
  emptyContainer: {
     alignItems: 'center',
     marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
  // Calendar Styles
  calendarContainer: {
      paddingTop: 16,
      paddingBottom: 30, // Safe area padding simulation
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
      elevation: 4,
  },
  monthHeaderContainer: {
      paddingBottom: 10,
  },
  monthHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
      height: 40,
  },
  headerTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
  },
  monthText: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.5,
      fontFamily: Fonts.serif,
  },
  navButton: {
      padding: 10,
  },
  daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 10,
  },
  daysRowExpanded: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
  },
  weekNumber: {
      marginRight: 10,
  },
  weekNumText: {
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: Fonts.mono,
  },
  dayCol: {
      alignItems: 'center',
      width: 40, 
      marginBottom: 5, // Spacing for rows in expanded view
  },
  dayColExpanded: {
      width: '14.28%', // 100% / 7 days
  },
  dayName: {
      color: '#8E8E93',
      fontSize: 12,
      marginBottom: 8,
      fontWeight: '500',
      fontFamily: Fonts.sans,
  },
  selectedDayText: {
      color: '#fff',
  },
  dimmedText: {
      opacity: 0.3,
  },
  dayNumContainer: {
      width: 36,
      height: 36,
      borderRadius: 12, // Slightly squarer
      justifyContent: 'center',
      alignItems: 'center',
  },
  selectedDayNumContainer: {
      backgroundColor: Colors.light.macroCarbs, // Use a theme color (e.g. Clay/Gold)
  },
  todayNumContainer: {
     borderWidth: 1,
     borderColor: Colors.light.macroCarbs,
  },
  dayNum: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Fonts.sans,
  },
  selectedDayNum: {
      color: '#fff', // White text on selected
  },
  todayNumText: {
      color: Colors.light.macroCarbs,
  },
  hasDataDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.light.macroCarbs,
      marginTop: 4,
  }
});
