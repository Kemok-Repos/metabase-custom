(ns metabase.troubleshooting
  (:require
   [metabase.analytics.stats :as stats]
   [metabase.config :as config]
   [metabase.db :as mdb]
   [metabase.driver :as driver]
   [toucan2.core :as t2]))

(set! *warn-on-reflection* true)

(defn system-info
  "System info we ask for for bug reports"
  []
  (into (sorted-map)
        (select-keys (System/getProperties) ["java.runtime.name"
                                             "java.runtime.version"
                                             "java.vendor"
                                             "java.vendor.url"
                                             "java.version"
                                             "java.vm.name"
                                             "java.vm.version"
                                             "os.name"
                                             "os.version"
                                             "user.language"
                                             "user.timezone"
                                             "file.encoding"])))

(defn metabase-info
  "Make it easy for the user to tell us what they're using"
  []
  {:databases                    (->> (t2/select 'Database) (map :engine) distinct)
   :hosting-env                  (stats/environment-type)
   :application-database         (mdb/db-type)
   :application-database-details (t2/with-connection [^java.sql.Connection conn]
                                   (let [metadata (.getMetaData conn)]
                                     {:database    {:name    (.getDatabaseProductName metadata)
                                                    :version (.getDatabaseProductVersion metadata)}
                                      :jdbc-driver {:name    (.getDriverName metadata)
                                                    :version (.getDriverVersion metadata)}}))
   :run-mode                     (config/config-kw :mb-run-mode)
   :version                      config/mb-version-info
   :settings                     {:report-timezone (driver/report-timezone)}})
