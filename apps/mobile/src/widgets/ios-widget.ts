/**
 * Life OS iOS Widget — Quick Stats Widget
 * 
 * To use this with Expo:
 * 1. Install: npx expo install expo-widgets (requires Expo SDK 51+)
 * 2. Create the widget target in your Xcode project
 * 3. Reference these configurations
 * 
 * Widget shows: Today's task count, current XP/Level, and habit streak
 */

export const widgetConfig = {
    // Widget metadata (used in Info.plist)
    identifier: 'com.lifeos.quickstats',
    displayName: 'Life OS Stats',
    description: 'View your daily progress at a glance',

    // Supported widget sizes
    supportedFamilies: [
        'systemSmall',
        'systemMedium',
    ],

    // Data refresh strategy
    timelineConfig: {
        // Refresh every 30 minutes
        refreshIntervalMinutes: 30,
        // API endpoint to fetch widget data
        dataUrl: (userId: string) =>
            `${process.env.EXPO_PUBLIC_API_URL}/api/widget-data?userId=${userId}`,
    },
}

// SwiftUI widget view template string (to be placed in iOS Widget Extension)
export const swiftUIWidgetCode = `
import WidgetKit
import SwiftUI

struct LifeOSEntry: TimelineEntry {
    let date: Date
    let tasksCompleted: Int
    let totalTasks: Int
    let level: Int
    let xp: Int
    let habitStreak: Int
    let greeting: String
}

struct LifeOSWidgetView: View {
    var entry: LifeOSEntry
    @Environment(\\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct SmallWidgetView: View {
    var entry: LifeOSEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f0f1e"), Color(hex: "1e0f2e")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "bolt.fill")
                        .foregroundColor(.purple)
                        .font(.caption)
                    Text("Life OS")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                }
                
                Text("Lv. \\(entry.level)")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                
                Text("\\(entry.tasksCompleted)/\\(entry.totalTasks) tasks")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Text("🔥 \\(entry.habitStreak) days")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
            .padding()
        }
    }
}

struct MediumWidgetView: View {
    var entry: LifeOSEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f0f1e"), Color(hex: "1e0f2e")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Life OS")
                        .font(.headline.bold())
                        .foregroundColor(.white)
                    
                    Text(entry.greeting)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                VStack(spacing: 12) {
                    StatPill(icon: "⚡", label: "Lv. \\(entry.level)", color: .indigo)
                    StatPill(icon: "✅", label: "\\(entry.tasksCompleted)/\\(entry.totalTasks)", color: .green)
                    StatPill(icon: "🔥", label: "\\(entry.habitStreak)d streak", color: .orange)
                }
            }
            .padding()
        }
    }
}

struct StatPill: View {
    let icon: String
    let label: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Text(icon).font(.caption)
            Text(label).font(.caption.bold()).foregroundColor(.white)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.2))
        .cornerRadius(8)
    }
}

@main
struct LifeOSWidget: Widget {
    let kind: String = "LifeOSWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LifeOSWidgetView(entry: entry)
        }
        .configurationDisplayName("Life OS Stats")
        .description("See your daily progress at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
`
