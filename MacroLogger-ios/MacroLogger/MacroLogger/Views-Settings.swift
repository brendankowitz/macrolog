import SwiftUI

// MARK: - Settings View
struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showAPIKeyHidden = true

    var body: some View {
        NavigationStack {
            ZStack {
                Color(UIColor(red: 0.976, green: 0.98, blue: 0.988, alpha: 1)).ignoresSafeArea()

                if viewModel.isLoading {
                    loadingView
                } else {
                    contentView
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .onAppear {
                viewModel.loadData()
            }
            .alert("Enable Apple Health?", isPresented: $viewModel.showHealthKitPrompt) {
                Button("Enable") {
                    viewModel.requestHealthKitPermissions()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("MacroLog needs permission to save your nutrition data to Apple Health")
            }
        }
    }

    @ViewBuilder
    private var loadingView: some View {
        VStack {
            ProgressView()
            Text("Loading Settings...")
                .foregroundColor(.gray)
                .padding(.top)
        }
    }

    @ViewBuilder
    private var contentView: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerView
                apiKeySection
                dailyGoalsSection
                appleHealthSection
                achievementsSection
                saveButtonAndError
            }
        }
    }

    @ViewBuilder
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Settings")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.black)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal)
    }

    @ViewBuilder
    private var apiKeySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("OPENAI API KEY")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1)
                .foregroundColor(.gray)

            HStack {
                if showAPIKeyHidden {
                    SecureField("Enter API Key", text: $viewModel.apiKey)
                } else {
                    TextField("Enter API Key", text: $viewModel.apiKey)
                }

                Button(action: { showAPIKeyHidden.toggle() }) {
                    Image(systemName: showAPIKeyHidden ? "eye.slash" : "eye")
                        .foregroundColor(.gray)
                }
            }
            .padding(12)
            .background(.white)
            .cornerRadius(12)
        }
        .padding(.horizontal)
    }

    @ViewBuilder
    private var dailyGoalsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("DAILY GOALS")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1)
                .foregroundColor(.gray)
                .padding(.horizontal)

            GoalSliderView(
                label: "Calories",
                value: $viewModel.settings.daily_goals.calories,
                range: 1000...3500,
                unit: "kcal"
            )

            GoalSliderView(
                label: "Protein",
                value: $viewModel.settings.daily_goals.protein,
                range: 50...200,
                unit: "g"
            )

            GoalSliderView(
                label: "Carbs",
                value: $viewModel.settings.daily_goals.carbs,
                range: 100...400,
                unit: "g"
            )

            GoalSliderView(
                label: "Fat",
                value: $viewModel.settings.daily_goals.fat,
                range: 30...150,
                unit: "g"
            )
        }
    }

    @ViewBuilder
    private var appleHealthSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("APPLE HEALTH")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1)
                .foregroundColor(.gray)
                .padding(.horizontal)

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Sync to Apple Health")
                        .font(.system(.body, weight: .semibold))
                        .foregroundColor(.black)
                    Text("Save nutrition data to Apple Health")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.settings.appleHealth.enabled },
                    set: { viewModel.toggleHealthKit($0) }
                ))
            }
            .padding(12)
            .background(.white)
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }

    @ViewBuilder
    private var achievementsSection: some View {
        if !viewModel.settings.achievements.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("ACHIEVEMENTS")
                    .font(.system(size: 12, weight: .semibold))
                    .tracking(1)
                    .foregroundColor(.gray)
                    .padding(.horizontal)

                ForEach(viewModel.settings.achievements) { achievement in
                    achievementRow(achievement)
                }
                .padding(.horizontal)
            }
        }
    }

    @ViewBuilder
    private func achievementRow(_ achievement: Achievement) -> some View {
        HStack(spacing: 12) {
            Text(achievement.emoji)
                .font(.system(size: 24))
            VStack(alignment: .leading, spacing: 2) {
                Text(achievement.name)
                    .font(.system(.body, weight: .semibold))
                    .foregroundColor(achievement.unlocked ? .black : .gray)
                Text(achievement.description)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            Spacer()
            if achievement.unlocked {
                Text("✓")
                    .font(.system(.body, weight: .bold))
                    .foregroundColor(.green)
            }
        }
        .padding(12)
        .background(.white)
        .cornerRadius(12)
    }

    @ViewBuilder
    private var saveButtonAndError: some View {
        VStack {
            Button(action: viewModel.saveSettings) {
                Text("Save Settings")
                    .font(.system(.body, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Color(red: 0.235, green: 0.51, blue: 0.961))
                    .cornerRadius(12)
            }
            .padding(.horizontal)

            if let error = viewModel.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }

            Spacer(minLength: 50)
        }
    }
}

// MARK: - Goal Slider Component
struct GoalSliderView: View {
    let label: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    let unit: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(.system(.body, weight: .semibold))
                    .foregroundColor(.black)
                Spacer()
                Text("\(value) \(unit)")
                    .font(.system(.body, weight: .semibold))
                    .foregroundColor(Color(red: 0.235, green: 0.51, blue: 0.961))
            }
            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { value = Int($0) }
                ),
                in: Double(range.lowerBound)...Double(range.upperBound),
                step: 1
            )
            .tint(Color(red: 0.235, green: 0.51, blue: 0.961))
        }
        .padding(12)
        .background(.white)
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

#Preview {
    SettingsView()
}
