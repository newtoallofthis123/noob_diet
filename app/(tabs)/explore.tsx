
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
  date?: string;
};

type DaySection = {
  title: string;
  date: Date;
  totalCalories: number;
  data: Entry[];
};

export default function HistoryScreen() {
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
      const dateStr = entry.date || new Date().toISOString(); // Fallback for old data
      const date = parseISO(dateStr);
      const dayKey = format(date, 'yyyy-MM-dd');

      if (!groups[dayKey]) {
        groups[dayKey] = {
          title: format(date, 'EEEE, MMM d'),
          date: date,
          totalCalories: 0,
          data: []
        };
      }
      
      groups[dayKey].data.push(entry);
      groups[dayKey].totalCalories += (entry.total_calories || 0);
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

  const renderSectionHeader = ({ section: { title, totalCalories } }: { section: DaySection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCalories}>{totalCalories} cal</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Entry }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => router.push(`/details/${item.id}`)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text numberOfLines={2} style={styles.itemSnippet}>
              {item.formatted_menu}
          </Text>
      </View>
      <View style={styles.itemMeta}>
         <Text style={styles.itemCalories}>{item.total_calories || 0} cal</Text>
         <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.calendarContainer}>
            <TouchableOpacity onPress={toggleExpand} style={styles.monthHeaderContainer}>
                <View style={styles.monthHeader}>
                    {isExpanded && (
                        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color="#A0A0A5" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTextContainer}>
                         <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
                         <Ionicons 
                            name={isExpanded ? "chevron-down" : "chevron-up"} 
                            size={16} 
                            color="#A0A0A5" 
                            style={{ marginLeft: 5 }}
                         />
                    </View>
                    {isExpanded && (
                        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color="#A0A0A5" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            <View style={[styles.daysRow, isExpanded && styles.daysRowExpanded]}>
                {!isExpanded && (
                    <View style={styles.weekNumber}>
                        <Text style={styles.weekNumText}>W{format(selectedDate, 'w')}</Text>
                    </View>
                )}
                {renderDays()}
            </View>
        </View>
    );
  };

  const filteredSections = sections.filter(section => isSameDay(section.date, selectedDate));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No entries for {format(selectedDate, 'MMM d')}</Text>
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
    backgroundColor: '#fff',
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
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#fff', 
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  sectionCalories: {
      fontSize: 16,
      fontWeight: '600',
      color: '#4CD964', // Greenish
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
      flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  itemSnippet: {
    fontSize: 14,
    color: '#666',
  },
  itemMeta: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: 10,
  },
  itemCalories: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#555',
      marginBottom: 4,
  },
  emptyContainer: {
     alignItems: 'center',
     marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // Calendar Styles
  calendarContainer: {
      backgroundColor: '#1c1c1e', // Dark theme as per image request
      paddingTop: 10,
      paddingBottom: 30, // Safe area padding simulation
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
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
      color: '#A0A0A5', 
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
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
      color: '#A0A0A5',
      fontSize: 16,
      fontWeight: 'bold',
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
  },
  selectedDayText: {
      color: '#fff',
  },
  dimmedText: {
      opacity: 0.3,
  },
  dayNumContainer: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
  },
  selectedDayNumContainer: {
      backgroundColor: '#FFCC99', // Peach color selected
  },
  todayNumContainer: {
     // Optional: different style for today if not selected, e.g. border
     borderWidth: 1,
     borderColor: '#FFCC99',
  },
  dayNum: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
  },
  selectedDayNum: {
      color: '#1c1c1e', // Dark text on light selection
  },
  todayNumText: {
      color: '#FFCC99',
  },
  hasDataDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FFCC99',
      marginTop: 6,
  }
});
