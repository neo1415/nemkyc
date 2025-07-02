Prompt for lovable create nem forms .

The beginning may confuse you, don let it, just sticl to what we discussed :

the issue is that when i click submit in review, the dates, the boolean fielkds and the file uploads doneret show up or show up empy in the summary-dialog and when i click on submit it says those fields have an invalid format... even when i do fill uo the dields again in the summary-dialog, the dates do work but the booleans and stuff lke files still dont work...it probably has to do with th way the data  is being stored in locl storage and fetched again as invalidformats or somthing.. i need serious helpin getting this to work..so analyze everythiung well for me ......so lemme give you these  files and folders....look at this multistep form: This is for 
motor claims: personal-info:hooks/useStore: import {
  defaultValues,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/personal-info/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "motor-personal-info-store",
  }
);


export { useStore, useStore as useMotorPersonalInfoStore };


tyoes/schema: import { z } from "zod";
import validator from "validator";
import { calculatePastDate } from "@/utils/calculatePastDate";


const schema = z.object({
  policyNumber: z.string().min(1, "Policy number is required."),


  periodOfCoverFrom: z.coerce.date({
    errorMap: () => ({ message: "Start date is required." }),
  }),
  periodOfCoverTo: z.coerce.date({
    errorMap: () => ({ message: "End date is required." }),
  }),


  insuredNameOrCompanyName: z.string().min(1, "Name or Company Name is required."),
  title: z.string().min(1, "Title is required."),
  dateOfBirth: z.coerce
    .date()
    .max(calculatePastDate(18), "You must be at least 18 years old.")
    .min(calculatePastDate(100), "Date of birth too old."),
gender: z.enum(["Male", "Female", "Other"], {
  errorMap: () => ({ message: "Please select your gender" }),
}),
  address: z.string().min(1, "Address is required."),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .refine((val) => validator.isMobilePhone(val, "en-NG"), {
      message: "Enter a valid Nigerian phone number.",
    }),
  email: z.string().email("Invalid email address."),
  alertPreference: z.enum(["Email", "SMS", "Both"], {
    errorMap: () => ({ message: "Select an alert preference." }),
  }),
});


type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  policyNumber: "",
  periodOfCoverFrom: new Date(),
  periodOfCoverTo: new Date(),
insuredNameOrCompanyName: "",
  title: "",
  dateOfBirth: calculatePastDate(18),
gender: "Male",
  address: "",
  phone: "",
  email: "",
  alertPreference: "Email", // default to one option
};


export {
  schema,
  schema as motorPersonalInfoSchema,
  type Schema,
  defaultValues,
};



page.tsx:import { Form } from "@/features/form/components/form";


import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import {
  defaultValues,
  schema,
  Schema,
} from "./types/schema";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/motorDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler} from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
// import {
//   Autocomplete,
//   AutocompleteOption,
// } from "@/features/form/components/controllers/autocomplete";
// import { useFormContext } from "@/features/form/hooks/useFormContext";


const Page = () => {
  // const statesQuery = useStates();
  // const citiesQuery = useCities();


  // const { control, setValue } = useFormContext<Schema>();
  // const state = useWatch({ control, name: "state" });


  // const handleOptionSelect = (option: AutocompleteOption | null) => {
  //   if (!option) {
  //     setValue("city", "");
  //   }
  // };


  const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];




  return (
    <>
     <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="policyNumber" label={d.policyNumber} />
      </Grid>
      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema> name="periodOfCoverFrom" label={d.periodOfCoverFrom} />
      </Grid>
      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema> name="periodOfCoverTo" label={d.periodOfCoverTo} />
      </Grid>
     <Grid size={{ xs: 4 }}>
  <TextField<Schema> name="insuredNameOrCompanyName" label={d.insuredName} />
</Grid>
<Grid size={{ xs: 4 }}>
  <TextField<Schema> name="title" label={d.title} />
</Grid>
<Grid size={{ xs: 4 }}>
  <DatePicker<Schema>
    name="dateOfBirth"
    label={d.dateOfBirth}
    maxDate={calculatePastDate(18)}
    minDate={calculatePastDate(100)}
  />
</Grid>
<Grid size={{ xs: 4 }}>
  <Menu<Schema>
    name="gender"
    options={genderOptions}
    sx={{ width: "100%" }}
  />
</Grid>
<Grid size={{ xs: 4 }}>
  <TextField<Schema> name="email" label={d.email} />
</Grid>
<Grid size={{ xs: 4 }}>
  <TextField<Schema>
    name="phone"
    label={d.phoneNumber}
    format="phoneNumber"
  />
</Grid>
 <Grid size={{ xs: 12 }}>
    <TextField<Schema> name="address" label={d.address} multiline maxRows={3} />
  </Grid>
    </>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();


  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/motor/vehicle-details");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.personalInfo}
    >
      <Page />
    </Form>
  );
};


export { Provider as MotorPersonalInfo };


.. then the next section is incident details…in there we have hooks/useStore:import {
  defaultValues,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/incident-details/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "incident-details-store",
  }
);


export { useStore, useStore as useMotorIncidentDetailsStore };


types/schema: import { z } from "zod";


const schema = z.object({
  incidentDateTime: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Invalid date and time",
    }),
  incidentLocation: z.string().min(1).max(100),
  incidentDescription: z.string().min(1).max(500),
})




type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  incidentDateTime: "",
  incidentLocation: "",
  incidentDescription: "",


};


export {
  schema,
  schema as motorIncidentDetailsSchema,
  type Schema,
  defaultValues,
};
page.tsx:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { TextField } from "@/features/form/components/controllers/text-field";
import { d } from "@/utils/motorDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler} from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";
import { useStore } from "./hooks/useStore";


const Page = () => {


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema> name="incidentLocation" label={d.incidentLocation} />
      </Grid>


      <Grid size={{ xs: 12 }}>
  <DateTimePicker<Schema>
    name="incidentDateTime"
    label="Incident Date & Time"
    ampm // optional: adds AM/PM
    minutesStep={5} // optional: snap to every 5 minutes
  />
</Grid>
   
        <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="incidentDescription"
          label={d.incidentDescription}
        />
      </Grid>


    </>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();


  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/motor/witnesses");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.incidentDetails}
    >
      <Page />
    </Form>
  );
};


export { Provider as IncidentDetails };


Next is other drivers section…so in there component/otherDrivers:import { TextField } from "@/features/form/components/controllers/text-field";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { d } from "@/utils/motorDictionary/dictionary";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react/jsx-runtime";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema } from "../types/schema";


const OtherDrivers = () => {
  const { control, readOnly } = useFormContext<Schema>();


  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherDrivers",
  });


  const handleAddClick = () => {
    append({
      carRegistrationNumber: "",
      carMakeModel: "",
      driverName: "",
      driverPhone: "",
      driverAddress: "",
      injuryDamageDescription: "",
    });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="otherDrivers"
      >
        <Typography variant="subtitle2">{d.otherVehicleInvolved1}:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={{ xs: 12 }}
          >
            <Chip
              label={`${d.otherVehicleInvolved1} #${index + 1}:`}
              size="small"
              color="secondary"
            />
            {!readOnly && (
              <IconButton
                color="error"
                onClick={() => handleRemoveClick(index)}
              >
                <RemoveCircleOutlineRoundedIcon />
              </IconButton>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`otherDrivers.${index}.carRegistrationNumber`}
              label={d.otherVehicleRegNumber1}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`otherDrivers.${index}.carMakeModel`}
              label={d.otherVehicleMakeModel1}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`otherDrivers.${index}.driverName`}
              label={d.otherDriverName1}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`otherDrivers.${index}.driverPhone`}
              label={d.otherDriverPhone1}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name={`otherDrivers.${index}.driverAddress`}
              label={d.otherDriverAddress1}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name={`otherDrivers.${index}.injuryDamageDescription`}
              label={d.injuryDamageDescription1}
            />
          </Grid>
        </Fragment>
      ))}
    </>
  );
};


export { OtherDrivers };
…components/witnesses:: // import { ErrorMessage } from "@/features/form/components/error-message";
import { TextField } from "@/features/form/components/controllers/text-field";
import { d } from "@/utils/motorDictionary/dictionary";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react/jsx-runtime";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema } from "../types/schema";


const Witnesses = () => {
  const { control, readOnly } = useFormContext<Schema>();


  const { fields, append, remove } = useFieldArray({
    control,
    name: "witness",
  });


  const handleAddClick = () => {
    append({ witnessName: "", witnessPhone: "", witnessAddress: "" });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="witness"
      >
        <Typography variant="subtitle2">{d.witness}:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={{ xs: 12 }}
          >
            <Chip
              label={`${d.employer} #${index + 1}:`}
              size="small"
              color="secondary"
            />
            {!readOnly && (
              <IconButton
                color="error"
                onClick={() => handleRemoveClick(index)}
              >
                <RemoveCircleOutlineRoundedIcon />
              </IconButton>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessName`}
              label={d.witnessName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessPhone`}
              label={d.witnessPhone}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessAddress`}
              label={d.witnessAddress}
              multiline
              maxRows={4}
            />
          </Grid>
        </Fragment>
      ))}
      {/* <Grid size={{ xs: 12 }}>
        <ErrorMessage<Schema> name="previousEmployers" />
      </Grid> */}
    </>
  );
};


export { Witnesses };


hooks/useStore: import {
  defaultValues,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/otherDrivers/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "other-drivers-store",
  }
);


export { useStore, useStore as useOtherDriverssStore };


types/schema: import { z } from "zod";
import { ApiWitnessPassengerEnum } from "./apiTypes";


const WitnessPassengerEnum = z.nativeEnum(ApiWitnessPassengerEnum);


const witnessSchema = z.object({
  witnessName: z.string().min(1),
  witnessPhone: z.string().min(1),
  witnessAddress: z.string().max(1000),
});


// const educationalInstitutionsSchema = z.object({
//   institutionName: z.string().min(1),
//   degree: z.string().min(1),
//   fieldOfStudy: z.string().min(1),
//   graduationYear: z.coerce.date().max(new Date()).min(calculatePastDate(100)),
// });


const otherDriverSchema = z.object({
  carRegistrationNumber: z.string().min(1),
  carMakeModel: z.string().min(1),
  driverName: z.string().min(1),
  driverPhone: z.string().min(1),
  driverAddress: z.string().min(1),
  injuryDamageDescription: z.string().min(1).max(1000),
});


const schema = z
  .object({
  witness:  z.array(witnessSchema).min(1),
  otherWitnessPassengers: z.string().optional(),
  WitnessPassenger: z.array(WitnessPassengerEnum).min(1),
  otherVehiclesInvolved: z.string().min(1),
  otherDrivers: z.array(otherDriverSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const hasOtherWitnessPassengers =
      data.WitnessPassenger.includes(
        WitnessPassengerEnum.enum.MORE
      );


    if (hasOtherWitnessPassengers && !data.otherWitnessPassengers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["otherWitnessPassengers"],
      });
    }


    if (data.otherVehiclesInvolved === "Yes" && (!data.otherDrivers || data.otherDrivers.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one other driver must be added when other vehicles are involved",
        path: ["otherDrivers"],
      });
    }
  });


type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  witness: [],
  WitnessPassenger: [],
  otherWitnessPassengers: " ",
  otherVehiclesInvolved: "",
  otherDrivers: [],
};


export {
  defaultValues,
  WitnessPassengerEnum,
  schema,
  schema as otherDriversSchema,
  type Schema,
};


hooks/apiTypes: enum ApiWitnessPassengerEnum {
  WITNESS_1 = "1",
  WITNESS_2 = "2",
  WITNESS_3 = "3",
  WITNESS_4 = "4",
  WITNESS_5 = "5",
  WITNESS_6 = "6",
  MORE = "7"
}


export { ApiWitnessPassengerEnum };


Page.tsx: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Menu } from "@/features/form/components/controllers/menu";
import { d } from "@/utils/motorDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import { useStore } from "./hooks/useStore";
import { OtherDrivers } from "./components/OtherDrivers";
import { useFormContext } from "@/features/form/hooks/useFormContext";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const otherVehiclesInvolved = useWatch({
    control,
    name: "otherVehiclesInvolved",
  });


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="otherVehiclesInvolved"
          label="Were other vehicles involved in the accident?"
          options={[
            { value: "Yes", label: "Yes" },
            { value: "No", label: "No" },
          ]}
        />
      </Grid>


      {otherVehiclesInvolved === "Yes" && <OtherDrivers />}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/motor/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Other Vehicles Involved"
    >
      <Page />
    </Form>
  );
};


export { Provider as OtherDriversPage };


Next section is vehicle-details… hooks/useStore: import {
  defaultValues,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/vehicle-details/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "vehicle-details-store",
  }
);


export { useStore, useStore as useVehicleDetailsStore };


….types/schema:import { z } from "zod";


const schema = z.object({
    vehicleRegisteredInName: z.boolean(),
    registeredInYourNameDetails: z.string().max(200).optional(),


    vehicleOwnership: z.boolean(),
    ownershipDetails: z.string().max(200).optional(),


    hirePurchase: z.boolean(),
    hirePurchaseDetails: z.string().max(200).optional(),


  vehicleUsage: z.string().min(1).max(100),
  trailerAttached: z.boolean(),
  vehicleRegistrationNumber: z.string().min(1).max(20),
  vehicleMakeModel: z.string().min(1).max(100),
  vehicleYear: z
    .string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear;
    }, "Enter a valid year"),
  engineNumber: z.string().min(1).max(50),
  chassisNumber: z.string().min(1).max(50),
  vehicleDamageDescription: z.string().min(1).max(500),
  vehicleInspectionAddress: z.string().min(1).max(200),
   vehicleInspectionTelephone: z.string().min(1).max(200),
    vehicleInspectionName: z.string().min(1).max(200)
}) .refine(
    (data) =>
      data.vehicleRegisteredInName === false
        ? data.registeredInYourNameDetails?.length
        : true,
    {
      path: ["registeredInYourNameDetails"],
      message: "Please provide details if not registered in your name.",
    }
  )
  .refine(
    (data) =>
      data.vehicleOwnership === false ? data.ownershipDetails?.length : true,
    {
      path: ["ownershipDetails"],
      message: "Please provide details if not owned solely by you.",
    }
  )
  .refine(
    (data) => (data.hirePurchase ? data.hirePurchaseDetails?.length : true),
    {
      path: ["hirePurchaseDetails"],
      message: "Please provide details if vehicle is on hire purchase.",
    }
  );




type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  vehicleRegisteredInName: false,
  vehicleOwnership: false,
  hirePurchase: false,
  hirePurchaseDetails: "",
  vehicleUsage: "",
  trailerAttached: false,
  vehicleRegistrationNumber: "",
  vehicleMakeModel: "",
  vehicleYear: "",
  engineNumber: "",
  chassisNumber: "",
  vehicleDamageDescription: "",
  vehicleInspectionAddress: "",
  vehicleInspectionTelephone: "",
  vehicleInspectionName: "",
};


export {
  schema,
  schema as vehicleDetailsSchema,
  type Schema,
  defaultValues,
};
page.tsx:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import {
  useHire,
  useOwned,
  useRegistered} from '@/features/multistep-forms/forms/claims/motor/vehicle-details/hooks/useQueries'
import { useStore } from "./hooks/useStore";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/motorDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import {
  Autocomplete,
} from "@/features/form/components/controllers/autocomplete";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema, schema, defaultValues } from "./types/schema";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextArea } from "@/features/form/components/controllers/text-area";


const Page = () => {
  const registeredQuery = useRegistered();
  const hiredQuery = useHire()
  const ownedQuery = useOwned()




  const { control, setValue } = useFormContext<Schema>();
 const registeredValue = useWatch({ control, name: "vehicleRegisteredInName" });
  const hireValue = useWatch({ control, name: "hirePurchase" });
  const ownedValue =useWatch({control, name: 'vehicleOwnership'})


//   const options = [
//   { value: "Yes", label: "Yes" },
//   { value: "No", label: "No" },
// ];




  return (
    <>


     <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="vehicleRegisteredInName"
          options={registeredQuery.data}
          loading={registeredQuery.isLoading}
          textFieldProps={{ label: d.vehicleRegisteredInName }}
          onOptionSelect={(option) => {
            setValue("vehicleRegisteredInName", option?.value === "no");
          }}
        />
      </Grid>


      {registeredValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="registeredInYourNameDetails"
            label="If not, give details"
          />
        </Grid>
      )}


     <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="hirePurchase"
          options={hiredQuery.data}
          loading={hiredQuery.isLoading}
          textFieldProps={{ label: d.hirePurchase }}
          onOptionSelect={(option) => {
            setValue("hirePurchase", option?.value === "yes");
          }}
        />
      </Grid>


      {hireValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="hirePurchaseDetails"
            label="If so, give details"
          />
        </Grid>
      )}


       <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="vehicleOwnership"
          options={ownedQuery.data}
          loading={ownedQuery.isLoading}
          textFieldProps={{ label: d.vehicleOwnership }}
          onOptionSelect={(option) => {
            setValue("vehicleOwnership", option?.value === "yes");
          }}
        />
      </Grid>


      {ownedValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="ownershipDetails"
            label="If so, give details"
          />
        </Grid>
      )}


      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="vehicleYear"
          label={d.vehicleYear}
          maxDate={calculatePastDate(18)}
          minDate={calculatePastDate(100)}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema> name="vehicleUsage" label={d.vehicleUsage} />
      </Grid>
<Grid size={{ xs: 4 }}>
  <Menu<Schema>
    name="trailerAttached"
    label={d.trailerAttached}
    options={[
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ]}
    sx={{ width: "100%" }}
  />
</Grid>
    <Grid size={{ xs: 4 }}>
      <TextField<Schema>
      name="vehicleRegistrationNumber"
      label={d.vehicleRegistrationNumber}
      />
    </Grid>
            <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="vehicleMakeModel"
          label={d.vehicleMakeModel}
        />
      </Grid>


        <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="engineNumber"
          label={d.engineNumber}
        />
      </Grid>


        <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="chassisNumber"
          label={d.chassisNumber}
        />
      </Grid>


        <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="vehicleDamageDescription"
          label={d.vehicleDamageDescription}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="vehicleInspectionAddress"
          label={d.vehicleInspectionAddress}
          multiline
          maxRows={4}
        />
      </Grid>
        <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="vehicleInspectionName"
          label={d.vehicleInspectionName}
          multiline
          maxRows={4}
        />
      </Grid>
        <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="vehicleInspectionTelephone"
          label={d.vehicleInspectionTelephone}
          multiline
          maxRows={4}
        />
      </Grid>
    </>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();


  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/motor/incident-details");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.insuredVehicle}
    >
      <Page />
    </Form>
  );
};


export { Provider as VehicleDetails };


Next section is witnesses :components/witneses : // import { ErrorMessage } from "@/features/form/components/error-message";
import { TextField } from "@/features/form/components/controllers/text-field";
import { d } from "@/utils/motorDictionary/dictionary";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react/jsx-runtime";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema } from "../types/schema";


const Witnesses = () => {
  const { control, readOnly } = useFormContext<Schema>();


  const { fields, append, remove } = useFieldArray({
    control,
    name: "witness",
  });


  const handleAddClick = () => {
    append({ witnessName: "", witnessPhone: "", witnessAddress: "" });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="witness"
      >
        <Typography variant="subtitle2">{d.witness}:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={{ xs: 12 }}
          >
            <Chip
              label={`${d.employer} #${index + 1}:`}
              size="small"
              color="secondary"
            />
            {!readOnly && (
              <IconButton
                color="error"
                onClick={() => handleRemoveClick(index)}
              >
                <RemoveCircleOutlineRoundedIcon />
              </IconButton>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessName`}
              label={d.witnessName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessPhone`}
              label={d.witnessPhone}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name={`witness.${index}.witnessAddress`}
              label={d.witnessAddress}
              multiline
              maxRows={4}
            />
          </Grid>
        </Fragment>
      ))}
      {/* <Grid size={{ xs: 12 }}>
        <ErrorMessage<Schema> name="previousEmployers" />
      </Grid> */}
    </>
  );
};


export { Witnesses };


hooks/useStore:import {
  defaultValues,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/witnesses/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "witnesses-store",
  }
);


export { useStore, useStore as useWitnessesStore };


types/schema:import { z } from "zod";
import { ApiWitnessPassengerEnum } from "./apiTypes";


const WitnessPassengerEnum = z.nativeEnum(ApiWitnessPassengerEnum);


const witnessSchema = z.object({
  witnessName: z.string().min(1),
  witnessPhone: z.string().min(1),
  witnessAddress: z.string().max(1000),
});


// const educationalInstitutionsSchema = z.object({
//   institutionName: z.string().min(1),
//   degree: z.string().min(1),
//   fieldOfStudy: z.string().min(1),
//   graduationYear: z.coerce.date().max(new Date()).min(calculatePastDate(100)),
// });


const schema = z
  .object({
  witness:  z.array(witnessSchema).min(1),
  otherWitnessPassengers: z.string().optional(),
  WitnessPassenger: z.array(WitnessPassengerEnum).min(1),
  })
  .superRefine((data, ctx) => {
    const hasOtherWitnessPassengers =
      data.WitnessPassenger.includes(
        WitnessPassengerEnum.enum.MORE
      );


    if (hasOtherWitnessPassengers && !data.otherWitnessPassengers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["otherWitnessPassengers"],
      });
    }
  });


type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  witness: [],
  WitnessPassenger: [],
  otherWitnessPassengers: " "
};


export {
  defaultValues,
WitnessPassengerEnum,
  schema,
  schema as WitnessesSchema,
  type Schema,
};


…types/apiTypes:enum ApiWitnessPassengerEnum {
  WITNESS_1 = "1",
  WITNESS_2 = "2",
  WITNESS_3 = "3",
  WITNESS_4 = "4",
  WITNESS_5 = "5",
  WITNESS_6 = "6",
  MORE = "7"
}


export { ApiWitnessPassengerEnum };


page.tsx:import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


import { Form } from "@/features/form/components/form";
import { TextField } from "@/features/form/components/controllers/text-field";
import {
  useWitnessPassenger,
} from "@/features/multistep-forms/forms/claims/motor/witnesses/hooks/useQueries";
import { useStore } from "@/features/multistep-forms/forms/claims/motor/witnesses/hooks/useStore";
import {
  defaultValues,
  schema,
  Schema,
  WitnessPassengerEnum,
} from "@/features/multistep-forms/forms/claims/motor/witnesses/types/schema";
import { d } from "@/utils/motorDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Witnesses } from "./components/Witness";


const Page = () => {
  const witnessPassengerQuery = useWitnessPassenger();




  const { control } = useFormContext<Schema>();


  const WitnessPassenger = useWatch({
    control,
    name: "WitnessPassenger",
  });


  return (
    <>
    <Witnesses />
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema, true>
          name="WitnessPassenger"
          options={witnessPassengerQuery.data}
          textFieldProps={{ label: d.witnessPassenger }}
          multiple={true}
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        {WitnessPassenger.includes(
          WitnessPassengerEnum.enum.MORE
        ) && (
          <TextField<Schema>
            name="otherWitnessPassengers"
            label={d.otherWitnessPassengers}
            multiline
            maxRows={4}
          />
        )}
      </Grid>


      {/* <EducationalInstitutions /> */}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();


  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/motor/other-drivers");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.otherWitnessPassengers}
    >
      <Page />
    </Form>
  );
};


export { Provider as WitnessPage };


…next section, final i think. Review …hooks/useStore: import { defaultValues, Schema } from "@/features/multistep-forms/forms/claims/motor/review/types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
  isSubmitted: boolean;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
  updateIsSubmitted: (is: State["isSubmitted"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
    isSubmitted: false,
    updateIsSubmitted: (is) =>
      set((state) => {
        state.isSubmitted = is;
      }),
  }),


  {
    name: "motor-insurance-review-store",
  }
);


export { useStore, useStore as useMotorInsuranceReviewStore };


…types/schema:import { d } from "@/utils/motorDictionary/dictionary";
import { z } from "zod";


const schema = z.object({
  termsAndConditionsAccepted: z.boolean().refine((val) => val === true, {
    message: `${d.youMustAcceptTermsAndConditions}.`,
  }),
});


type Schema = z.infer<typeof schema>;


const defaultValues: Schema = {
  termsAndConditionsAccepted: false,
};


export { defaultValues, schema as motorInsuranceReviewSchema, schema, type Schema };


…page.tsx: import { Form } from "@/features/form/components/form";


import SendOutlinedIcon from "@mui/icons-material/SendOutlined";


import { useTermsAndConditions } from "@/features/multistep-forms/forms/claims/motor/review/hooks/useQueries";
import { useStore } from "@/features/multistep-forms/forms/claims/motor/review/hooks/useStore";
import {
  defaultValues,
  schema,
  Schema,
} from "@/features/multistep-forms/forms/claims/motor/review/types/schema";
import { useEmployeeWrapperStore } from "@/features/multistep-forms/forms/claims/motor/wrapper/hooks/useStore";
import { Checkbox } from "@/features/form/components/controllers/checkbox";
import { d } from "@/utils/motorDictionary/dictionary";
import { Box, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";


const Page = () => {
  const termsAndConditionsQuery = useTermsAndConditions();


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Stack
          sx={{
            gap: 2,
            maxHeight: 400,
            overflow: "scroll",
          }}
        >
          {termsAndConditionsQuery.data?.map((item) => (
            <Box key={item.title}>
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body1">{item.content}</Typography>
            </Box>
          ))}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Checkbox<Schema>
          name="termsAndConditionsAccepted"
          label={`${d.iAcceptTermsAndConditions}.`}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};
const Provider = ({ readOnly }: ProviderProps) => {
  const { updateSummaryDialogOpen } = useEmployeeWrapperStore();
  const { formData, updateFormData, updateIsSubmitted } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    updateSummaryDialogOpen(true);
    updateIsSubmitted(true);
  };


  const handleError = () => {
    updateIsSubmitted(true);
  };


  return (
    <Form
      schema={schema}
      slotProps={{
        submitButtonProps: { startIcon: <SendOutlinedIcon /> },
      }}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onError={handleError}
      readOnly={readOnly}
      title={d.review}
    >
      <Page />
    </Form>
  );
};


export { Provider as MotorInsuranceReview };


..then finally, the wrapper folder of motor: components/stepper: import { vehicleDetailsSchema } from "@/features/multistep-forms/forms/claims/motor/vehicle-details/types/schema"
import { motorIncidentDetailsSchema} from "@/features/multistep-forms/forms/claims/motor/incident-details/types/schema";
import { useMotorPersonalInfoStore } from "@/features/multistep-forms/forms/claims/motor/personal-info/hooks/useStore";
import { motorPersonalInfoSchema } from "@/features/multistep-forms/forms/claims/motor/personal-info/types/schema";
import { motorInsuranceReviewSchema } from "@/features/multistep-forms/forms/claims/motor/review/types/schema";
import { d } from "@/utils/motorDictionary/dictionary";
import {
  Stepper as MuiStepper,
  Step,
  StepButton,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router";
import { useWitnessesStore } from "../../witnesses/hooks/useStore";
import { WitnessesSchema } from "../../witnesses/types/schema";
import { useMotorIncidentDetailsStore } from "../../incident-details/hooks/useStore";
import { useVehicleDetailsStore } from "../../vehicle-details/hooks/useStore";
import { otherDriversSchema } from "../../otherDrivers/types/schema";
import { useOtherDriverssStore } from "../../otherDrivers/hooks/useStore";
import { useMotorInsuranceReviewStore } from "../../review/hooks/useStore";


const Stepper = () => {
  const { pathname } = useLocation();


  const { formData: motorPersonalInfoFormData } =
    useMotorPersonalInfoStore();
  const {formData: witnessesFormData} = useWitnessesStore();
  const { formData: motorIncidentDetailsFormData } = useMotorIncidentDetailsStore();
  const { formData: otherDriversFormData } = useOtherDriverssStore();
  const { formData: vehicleDetailsFormData } =
    useVehicleDetailsStore();
  const {
    formData: motorInsuranceReviewFormData,
    isSubmitted: ismotorInsuranceReviewSubmitted,
  } = useMotorInsuranceReviewStore();


  const { success: motorPersonaInfoSuccess } =
    motorPersonalInfoSchema.safeParse(motorPersonalInfoFormData);


  const { success: motorIncidentDetailsSuccess } = motorIncidentDetailsSchema.safeParse(
    motorIncidentDetailsFormData
  );


  const { success: witnessesSuccess } = WitnessesSchema.safeParse(
    witnessesFormData
  );


  const { success: vehicleDetailsSuccess } =
    vehicleDetailsSchema.safeParse(vehicleDetailsFormData);


    const { success: otherDriversSuccess } =
    otherDriversSchema.safeParse(otherDriversFormData);


  const { success: motorInsuranceReviewSuccess } = motorInsuranceReviewSchema.safeParse(
    motorInsuranceReviewFormData
  );


  const steps = [
    {
      href: "/claims/motor/personal-info",
      label: d.personalInfo,
      success: motorPersonaInfoSuccess,
    },
    {
      href: "/claims/motor/vehicle-details",
      label: d.vehicleDetails,
      success: vehicleDetailsSuccess,
    },
    {
      href: "/claims/motor/incident-details",
      label: d.incidentDetails,
      success: motorIncidentDetailsSuccess,
    },
    {
      href: "/claims/motor/witnesses",
      label: d.witness,
      success: witnessesSuccess,
    },
    {
      href: "/claims/motor/other-drivers",
      label: d.OtherDrivers,
      success: otherDriversSuccess,
    },
    {
      href: "/claims/motor/review",
      label: d.review,
      success: motorInsuranceReviewSuccess,
    },
  ];


  const activeStep = steps.findIndex((item) => item.href === pathname);


  return (
    <MuiStepper nonLinear activeStep={activeStep}>
      {steps.map((step) => (
        <Step key={step.href}>
          <StepButton
            color="inherit"
            href={step.href}
            optional={
              !step.success &&
              ismotorInsuranceReviewSubmitted && (
                <Typography variant="caption" color="error">
                  {d.invalidFormData}
                </Typography>
              )
            }
          >
            {step.label}
          </StepButton>
        </Step>
      ))}
    </MuiStepper>
  );
};


export { Stepper };


components/summary-dialog:import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useEmployeeHistoryStore } from "@/features/multistep-forms/forms/claims/motor/history/hooks/useStore";
import { useMotorInsuranceReviewStore } from "@/features/multistep-forms/forms/claims/motor/review/hooks/useStore";
import { MotorInsuranceReview } from "@/features/multistep-forms/forms/claims/motor/review/page";
import { useCreate } from "@/features/multistep-forms/forms/claims/motor/wrapper/hooks/useMutations";
import { useStore } from "@/features/multistep-forms/forms/claims/motor/wrapper/hooks/useStore";
import { schema } from "@/features/multistep-forms/forms/claims/motor/wrapper/types/schema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { showSnack } from "@/utils/showSnack";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { FormEvent } from "react";
import { d } from "@/utils/motorDictionary/dictionary";
import { useOtherDriverssStore } from "../../otherDrivers/hooks/useStore";
import { useMotorPersonalInfoStore } from "../../personal-info/hooks/useStore";
import { useWitnessesStore } from "../../witnesses/hooks/useStore";
import { useMotorIncidentDetailsStore } from "../../incident-details/hooks/useStore";
import { MotorPersonalInfo } from "../../personal-info/page";
import { VehicleDetails } from "../../vehicle-details/page";
import { IncidentDetails } from "../../incident-details/page";
import { WitnessPage } from "../../witnesses/page";
import { OtherDriversPage } from "../../otherDrivers/page";


const SummaryDialog = () => {
  const { summaryDialogOpen, updateSummaryDialogOpen } = useStore();
  const createMutation = useCreate();


  const { formData: motorPersonalInfoFormData } =
    useMotorPersonalInfoStore();
  const { formData: vehicleDetailsData } = useEmployeeHistoryStore();
  const { formData: motorIncidentDetailsFormData } = useMotorIncidentDetailsStore();
  const { formData: witnessesFormData } =
    useWitnessesStore();
  const { formData: otherDriversFormData } =
  useOtherDriverssStore();
  const { formData: motorInsuranceReviewFormData } = useMotorInsuranceReviewStore();


  const allFormData = {
    ...motorPersonalInfoFormData,
    ...vehicleDetailsData,
    ...motorIncidentDetailsFormData,
    ...witnessesFormData,
    ...otherDriversFormData,
    ...motorInsuranceReviewFormData,
  };


  const handleClose = () => {
    if (!createMutation.isPending) {
      updateSummaryDialogOpen(false);
    }
  };


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      schema.parse(allFormData);
      createMutation.mutate(undefined, { onSuccess: handleClose });
    } catch (error) {
      showSnack(getErrorMessage(error), { variant: "error" });
    }
  };


  return (
    <Dialog
      open={summaryDialogOpen}
      component="form"
      onSubmit={onSubmit}
      fullWidth
      maxWidth="md"
      onClose={handleClose}
    >
      <DialogTitle variant="h5">{d.confirmInformation}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <MotorPersonalInfo readOnly />
        <Divider />
        <VehicleDetails readOnly />
        <Divider />
        <IncidentDetails readOnly />
        <Divider />
        <WitnessPage readOnly />
        <Divider />
        <OtherDriversPage readOnly />
        <Divider />
        <MotorInsuranceReview readOnly />
        <Divider />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {d.close}
        </Button>
        <LoadingButton
          type="submit"
          loading={createMutation.isPending}
          variant="contained"
          startIcon={<SendOutlinedIcon />}
        >
          {d.submit}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};


export { SummaryDialog };


Then hooks/useMutation:
import { useMotorPersonalInfoStore } from "@/features/multistep-forms/forms/claims/motor/personal-info/hooks/useStore";
import { useMotorInsuranceReviewStore } from "@/features/multistep-forms/forms/claims/motor/review/hooks/useStore";


import { create } from "@/features/multistep-forms/forms/claims/motor/wrapper/utils/api";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { showSnack } from "@/utils/showSnack";
import { useMutation } from "@tanstack/react-query";
import { useMotorIncidentDetailsStore } from "../../incident-details/hooks/useStore";
import { useWitnessesStore } from "../../witnesses/hooks/useStore";
import { useOtherDriverssStore } from "../../otherDrivers/hooks/useStore";
import { useVehicleDetailsStore } from "../../vehicle-details/hooks/useStore";


const useCreate = () => {
  const { formData: motorPersonalInfoFormData } =
    useMotorPersonalInfoStore();
  const { formData: vehicleDetailsData } = useVehicleDetailsStore();
  const { formData: motorIncidentDetailsFormData } = useMotorIncidentDetailsStore();
  const { formData: witnessesFormData } =
    useWitnessesStore();
  const { formData: otherDriversFormData } =
  useOtherDriverssStore();
  const { formData: employeeReviewFormData } = useMotorInsuranceReviewStore();




  return useMutation({
    mutationFn: () =>
      create({
        ...motorPersonalInfoFormData,
        ...vehicleDetailsData,
        ...motorIncidentDetailsFormData,
        ...witnessesFormData,
        ...otherDriversFormData,
        ...employeeReviewFormData,
      }),


    onSuccess: async () => {
      showSnack("Successful");
    },
    onError: (error) => {
      showSnack(getErrorMessage(error), { variant: "error" });
    },
  });
};


export { useCreate };


hooks/useStore:import { createStore } from "@/utils/createStore";


type State = {
  summaryDialogOpen: boolean;
};


type Actions = {
  updateSummaryDialogOpen: (is: State["summaryDialogOpen"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    summaryDialogOpen: false,
    updateSummaryDialogOpen: (is) =>
      set((state) => {
        state.summaryDialogOpen = is;
      }),
  }),
  {
    name: "employee-wrapper-store",
  }
);


export { useStore, useStore as useEmployeeWrapperStore };


..then types/schema: import { motorPersonalInfoSchema } from "@/features/multistep-forms/forms/claims/motor/personal-info/types/schema";
import { z } from "zod";
import { vehicleDetailsSchema } from "../../vehicle-details/types/schema";
import { motorIncidentDetailsSchema } from "../../incident-details/types/schema";
import { WitnessesSchema } from "../../witnesses/types/schema";
import { otherDriversSchema } from "../../otherDrivers/types/schema";


const schema = motorPersonalInfoSchema
  .and(vehicleDetailsSchema)
  .and(motorIncidentDetailsSchema)
  .and(WitnessesSchema)
  .and(otherDriversSchema);


type Schema = z.infer<typeof schema>;


export { schema, type Schema };


utils/api: import { Schema } from "@/features/multistep-forms/forms/claims/motor/wrapper/types/schema";
import { wait } from "@/utils/wait";

const create = async (data: Schema) => {
  await wait();
  console.log(data);
};

export { create };
….page.tsx: 
import { SummaryDialog } from "@/features/multistep-forms/forms/claims/motor/wrapper/components/summary-dialog";
import { Divider } from "@mui/material";
import { Outlet } from "react-router";
import { Stepper } from "./components/stepper";


const Page = () => {
  return (
    <>
      <SummaryDialog />
      <Stepper />
      <Divider sx={{ marginY: 2 }} />
      <Outlet />
    </>
  );
};


export { Page as MotorWrapper };



The next form i will show you is combined-gpa-employers…so in there for the section of insured-details…we have hooks/useStore: import { defaultValues, Schema } from "../types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "combined-gpa-employers-insured-details-store",
  }
);


export { useStore };
types/schema:import { z } from "zod";


export const schema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  periodOfCoverFrom: z.date({
    required_error: "Period of cover from is required",
    invalid_type_error: "Invalid date format",
  }),
  periodOfCoverTo: z.date({
    required_error: "Period of cover to is required",
    invalid_type_error: "Invalid date format",
  }),
  insuredName: z.string().min(1, "Name of insured is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  alertPreference: z.enum(["Email", "SMS", "Both"], {
    required_error: "Alert preference is required",
  }),
});


export type Schema = z.infer<typeof schema>;


export const defaultValues: Schema = {
  policyNumber: "",
  periodOfCoverFrom: new Date(),
  periodOfCoverTo: new Date(),
  insuredName: "",
  address: "",
  phone: "",
  email: "",
  alertPreference: "Email",
};
Page.tsx:  import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { Typography } from "@mui/material";


const Page = () => {
  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label="Policy Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label="Period of Cover From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label="Period of Cover To"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="insuredName"
          label="Name of Insured"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label="Phone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label="Email"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          We can send you alerts for any update on your claim. Please confirm how you would prefer to receive your alert:
        </Typography>
        <Autocomplete<Schema>
          name="alertPreference"
          options={[
            { label: "Email", value: "Email" },
            { label: "SMS", value: "SMS" },
            { label: "Both", value: "Both" },
          ]}
          textFieldProps={{ label: "Alert Preference" }}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/combined-gpa-employers/details-of-loss");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Insured Details"
    >
      <Page />
    </Form>
  );
};


export { Provider as InsuredDetailsPage };
Next section is detailsof loss, first components/DisabilityFields:import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextField } from "@/features/form/components/controllers/text-field";
import Grid from "@mui/material/Grid2";
import { useWatch } from "react-hook-form";
import { Schema } from "../types/schema";
import { useFormContext } from "@/features/form/hooks/useFormContext";


export const DisabilityFields = () => {
  const { control } = useFormContext<Schema>();


  const canPerformDuties = useWatch({
    control,
    name: "canPerformDuties",
  });


  return (
    <>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateStoppedWorking"
          label="Date Stopped Working"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="expectedDisablementDuration"
          label="Expected Duration of Disablement"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="canPerformDuties"
          label="Is the Injured Party able to carry out any part of their duties?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {canPerformDuties === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="currentServicesWorth"
            label="What are their services presently worth?"
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="hasClaimBeenMade"
          label="Has the Injured Party made any Claim on you?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
    </>
  );
};
components/monthlyEarningTable: import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useFieldArray } from "react-hook-form";
import { Schema } from "../../statement-of-earnings/types/schema";


export const MonthlyEarningsTable = () => {
  const { control } = useFormContext<Schema>();
  const { fields } = useFieldArray({
    control,
    name: "monthlyEarnings",
  });


  const totalWages = fields.reduce((acc, field, index) => {
    const amount = control._formValues.monthlyEarnings[index]?.wagesAndBonus || "0";
    return acc + Number(amount.replace(/[^0-9.-]+/g, ""));
  }, 0);


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Statement of Injured Party's Earnings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please provide the monthly earnings for the past 12 months or duration of employment. Include reasons for any absences.
        </Typography>
      </Grid>


      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month Ending</TableCell>
              <TableCell>Wages and Bonus</TableCell>
              <TableCell>Reason for Absence (if any)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <DatePicker<Schema>
                    name={`monthlyEarnings.${index}.monthEnding`}
                    label={`Month ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <TextField<Schema>
                    name={`monthlyEarnings.${index}.wagesAndBonus`}
                    label="Amount"
                  />
                </TableCell>
                <TableCell>
                  <TextField<Schema>
                    name={`monthlyEarnings.${index}.reasonForAbsence`}
                    label="Reason"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>


      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Total Wages Earned: ₦{totalWages.toLocaleString()}
        </Typography>
      </Grid>


      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="monthlyAllowanceValue"
            label="State the Monthly value of any allowances i.e. Food, Fuel, or Housing allowed to the Injured Party"
          />
        </Grid>
      </Grid>
    </>
  );
};
components/otherInsurers: import { TextField } from "@/features/form/components/controllers/text-field";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema } from "../types/schema";


export const OtherInsurers = () => {
  const { control, readOnly } = useFormContext<Schema>();


  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherInsurers",
  });


  const handleAddClick = () => {
    append({ name: "", address: "", policyNumber: "" });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="otherInsurers"
      >
        <Typography variant="subtitle2">Other Insurers:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} sx={{ display: "flex", alignItems: "center" }}>
              <Chip
                label={`Insurer #${index + 1}:`}
                size="small"
                color="secondary"
              />
              {!readOnly && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveClick(index)}
                >
                  <RemoveCircleOutlineRoundedIcon />
                </IconButton>
              )}
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField<Schema>
                name={`otherInsurers.${index}.name`}
                label="Name"
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField<Schema>
                name={`otherInsurers.${index}.address`}
                label="Address"
                multiline
                maxRows={4}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField<Schema>
                name={`otherInsurers.${index}.policyNumber`}
                label="Policy Number"
              />
            </Grid>
          </Grid>
        </Fragment>
      ))}
    </>
  );
};
components/witnesses:import { TextField } from "@/features/form/components/controllers/text-field";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Schema } from "../types/schema";


export const Witnesses = () => {
  const { control, readOnly } = useFormContext<Schema>();


  const { fields, append, remove } = useFieldArray({
    control,
    name: "witnesses",
  });


  const handleAddClick = () => {
    append({ name: "", address: "" });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="witness"
      >
        <Typography variant="subtitle2">Witnesses:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} sx={{ display: "flex", alignItems: "center" }}>
              <Chip
                label={`Witness #${index + 1}:`}
                size="small"
                color="secondary"
              />
              {!readOnly && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveClick(index)}
                >
                  <RemoveCircleOutlineRoundedIcon />
                </IconButton>
              )}
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField<Schema>
                name={`witnesses.${index}.name`}
                label="Name"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField<Schema>
                name={`witnesses.${index}.address`}
                label="Address"
                multiline
                maxRows={4}
              />
            </Grid>
          </Grid>
        </Fragment>
      ))}
    </>
  );
};
…hooks/useStore:import { defaultValues, Schema } from "../types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "combined-gpa-employers-details-of-loss-store",
  }
);


export { useStore };
types/schema:import { z } from "zod";


const witnessSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});


const otherInsurerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
});


export const schema = z.object({
  // Injured Party Information
  injuredPartyName: z.string().min(1, "Name is required"),
  injuredPartyAge: z.string().min(1, "Age is required"),
  injuredPartyAddress: z.string().min(1, "Address is required"),
  averageMonthlyEarnings: z.string().min(1, "Average monthly earnings is required"),
  occupation: z.string().min(1, "Occupation is required"),
  isDirectEmployee: z.enum(["true", "false"], {
    required_error: "Please specify if the injured party is in your direct employment",
  }),
  employmentDate: z.date().optional(),
  regularEmployerDetails: z.string().optional(),
  employmentDuration: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "widowed"], {
    required_error: "Marital status is required",
  }),
  hasPreviousAccidents: z.enum(["true", "false"], {
    required_error: "Please specify if there were previous accidents",
  }),
  previousAccidentsDetails: z.string().optional(),


  // Injury Details
  natureOfInjuries: z.string().min(1, "Nature of injuries is required"),
  personInChargeName: z.string().min(1, "Person in charge name is required"),
  personInChargePosition: z.string().min(1, "Person in charge position is required"),


  // Accident Details
  accidentDate: z.date({
    required_error: "Accident date is required",
    invalid_type_error: "Invalid date format",
  }),
  accidentTime: z.string().min(1, "Accident time is required"),
  accidentLocation: z.string().min(1, "Accident location is required"),
  dateReported: z.date({
    required_error: "Report date is required",
    invalid_type_error: "Invalid date format",
  }),
  reportedBy: z.string().min(1, "Reporter name is required"),
  dateStoppedWork: z.date({
    required_error: "Date stopped work is required",
    invalid_type_error: "Invalid date format",
  }),
  workEngagedIn: z.string().min(1, "Work description is required"),
  accidentDescription: z.string().min(1, "Accident description is required"),
  wasInjuredPartySober: z.enum(["sober", "intoxicated"]),


  // Medical Details
  isReceivingMedicalAttention: z.enum(["true", "false"], {
    required_error: "Please specify if receiving medical attention",
  }),
  hospitalName: z.string().optional(),
  hospitalAddress: z.string().optional(),
  doctorName: z.string().optional(),
  doctorAddress: z.string().optional(),


  // Disability Details
  isTotallyDisabled: z.enum(["true", "false"], {
    required_error: "Please specify if totally disabled",
  }),
  dateStoppedWorking: z.date().optional(),
  expectedDisablementDuration: z.string().optional(),
  canPerformDuties: z.enum(["true", "false"]).optional(),
  currentServicesWorth: z.string().optional(),
  hasClaimBeenMade: z.enum(["true", "false"]).optional(),


  // Witnesses and Other Insurers
  witnesses: z.array(witnessSchema),
  otherInsurers: z.array(otherInsurerSchema),
}).refine(
  (data) => {
    if (data.isDirectEmployee === "true") {
      return !!data.employmentDate;
    }
    return true;
  },
  {
    message: "Employment date is required for direct employees",
    path: ["employmentDate"],
  }
).refine(
  (data) => {
    if (data.hasPreviousAccidents === "true") {
      return !!data.previousAccidentsDetails;
    }
    return true;
  },
  {
    message: "Previous accidents details are required",
    path: ["previousAccidentsDetails"],
  }
).refine(
  (data) => {
    if (data.isReceivingMedicalAttention === "true") {
      return !!data.hospitalName && !!data.hospitalAddress && !!data.doctorName && !!data.doctorAddress;
    }
    return true;
  },
  {
    message: "Hospital and doctor details are required if receiving medical attention",
    path: ["hospitalName"],
  }
).refine(
  (data) => {
    if (data.isTotallyDisabled === "true") {
      return !!data.dateStoppedWorking &&
             !!data.expectedDisablementDuration &&
             data.canPerformDuties !== undefined &&
             (data.canPerformDuties === "true" ? !!data.currentServicesWorth : true) &&
             data.hasClaimBeenMade !== undefined;
    }
    return true;
  },
  {
    message: "All disability-related fields are required when totally disabled",
    path: ["dateStoppedWorking"],
  }
);


export type Schema = z.infer<typeof schema>;


export const defaultValues: Schema = {
  injuredPartyName: "",
  injuredPartyAge: "",
  injuredPartyAddress: "",
  averageMonthlyEarnings: "",
  occupation: "",
  isDirectEmployee: "false",
  employmentDate: undefined,
  regularEmployerDetails: "",
  employmentDuration: "",
  maritalStatus: "single",
  hasPreviousAccidents: "false",
  previousAccidentsDetails: "",
  natureOfInjuries: "",
  personInChargeName: "",
  personInChargePosition: "",
  accidentDate: new Date(),
  accidentTime: "",
  accidentLocation: "",
  dateReported: new Date(),
  reportedBy: "",
  dateStoppedWork: new Date(),
  workEngagedIn: "",
  accidentDescription: "",
  wasInjuredPartySober: "sober",
  isReceivingMedicalAttention: "false",
  hospitalName: "",
  hospitalAddress: "",
  doctorName: "",
  doctorAddress: "",
  isTotallyDisabled: "false",
  dateStoppedWorking: undefined,
  expectedDisablementDuration: "",
  canPerformDuties: undefined,
  currentServicesWorth: "",
  hasClaimBeenMade: undefined,
  witnesses: [],
  otherInsurers: [],
};
Page.tsx:: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DisabilityFields } from "./components/DisabilityFields";
import { Typography } from "@mui/material";
import { Witnesses } from "./components/Witnesses";
import { OtherInsurers } from "./components/OtherInsurers";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { useFormContext } from "@/features/form/hooks/useFormContext";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const isDirectEmployee = useWatch({
    control,
    name: "isDirectEmployee",
  });


  const hasPreviousAccidents = useWatch({
    control,
    name: "hasPreviousAccidents",
  });


  const isReceivingMedicalAttention = useWatch({
    control,
    name: "isReceivingMedicalAttention",
  });


  const isTotallyDisabled = useWatch({
    control,
    name: "isTotallyDisabled",
  });


  return (
    <>
      {/* Section 1 - Injured Party Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Injured Party Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="injuredPartyName"
          label="Name of Injured Party"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="injuredPartyAge"
          label="Age"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="injuredPartyAddress"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="averageMonthlyEarnings"
          label="Average Monthly Earnings"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="occupation"
          label="Occupation"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isDirectEmployee"
          label="Is the Injured Party in your direct employment?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isDirectEmployee === "true" && (
        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="employmentDate"
            label="Date of Employment"
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="maritalStatus"
          label="Marital Status"
          options={[
            { label: "Single", value: "single" },
            { label: "Married", value: "married" },
            { label: "Widowed", value: "widowed" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousAccidents"
          label="Has the injured party been previously involved in any accident?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousAccidents === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousAccidentsDetails"
            label="Please provide details of previous accidents"
            rows={4}
          />
        </Grid>
      )}


      {/* Section 2 - Injury Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Injury Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="natureOfInjuries"
          label="Please state the full nature of the injuries sustained (If incident occurred in connection with any machinery, provide details of machinery involved)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="personInChargeName"
          label="Name of Person in Charge"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="personInChargePosition"
          label="Position of Person in Charge"
        />
      </Grid>


      {/* Section 3 - Accident Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Accident Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="accidentDate"
          label="Date of Accident"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="accidentTime"
          label="Time of Accident"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="accidentLocation"
          label="Location of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateReported"
          label="Date Reported"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="reportedBy"
          label="Reported By"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateStoppedWork"
          label="Date Stopped Work"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="workEngagedIn"
          label="Work Engaged In at Time of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="accidentDescription"
          label="Description of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="wasInjuredPartySober"
          label="Was the Injured Party sober or intoxicated?"
          options={[
            { label: "Sober", value: "sober" },
            { label: "Intoxicated", value: "intoxicated" },
          ]}
        />
      </Grid>


      {/* Section 4 & 5 - Medical Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Medical Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isReceivingMedicalAttention"
          label="Is the Injured Party receiving medical attention?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isReceivingMedicalAttention === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hospitalName"
              label="Hospital Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hospitalAddress"
              label="Hospital Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="doctorName"
              label="Doctor's Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="doctorAddress"
              label="Doctor's Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      {/* Section 6 - Disability Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Disability Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isTotallyDisabled"
          label="Is the Injured Party totally disabled?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isTotallyDisabled === "true" && <DisabilityFields />}


      {/* Section 7 - Witnesses */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Witnesses
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Witnesses />
      </Grid>


      {/* Section 8 - Other Insurers */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Other Insurers
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <OtherInsurers />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/combined-gpa-employers/statement-of-earnings");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Then we have statement of earnings section. So for it…hooks/useStore:import { defaultValues, Schema } from "../types/schema";
import { createStore } from "@/utils/createStore";


type State = {
  formData: Schema;
};


type Actions = {
  updateFormData: (data: State["formData"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    formData: defaultValues,
    updateFormData: (data) =>
      set((state) => {
        state.formData = data;
      }),
  }),
  {
    name: "combined-gpa-employers-statement-of-earnings-store",
  }
);


export { useStore };
…types/schema:import { z } from "zod";


const monthlyEarningSchema = z.object({
  monthEnding: z.date({
    required_error: "Month ending is required",
    invalid_type_error: "Invalid date format",
  }),
  wagesAndBonus: z.string().min(1, "Wages and bonus is required"),
  reasonForAbsence: z.string().optional(),
});


export const schema = z.object({
  monthlyEarnings: z.array(monthlyEarningSchema).min(12, "12 months of earnings are required"),
  monthlyAllowanceValue: z.string().min(1, "Monthly allowance value is required"),
});


export type Schema = z.infer<typeof schema>;


export const defaultValues: Schema = {
  monthlyEarnings: Array(12).fill({
    monthEnding: new Date(),
    wagesAndBonus: "",
    reasonForAbsence: "",
  }),
  monthlyAllowanceValue: "",
};
..page.tsx:: import { Form } from "@/features/form/components/form";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { MonthlyEarningsTable } from "../details-of-loss/components/MonthlyEarningsTable";


const Page = () => {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Statement of Earnings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          THE WORKMAN'S COMPENSATION ORDINANCE PROVIDES FOR COMPENSATION BASED ON THE
          WORKMAN'S AVERAGE MONTHLY EARNING DURING THE PAST 12 MONTHS OR SUCH SHORT PERIOD
          AS HE MAY HAVE BEEN IN THE EMPLOYER'S SERVICE.
        </Typography>
      </Grid>
      <MonthlyEarningsTable />
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/combined-gpa-employers/review");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Statement of Earnings"
    >
      <Page />
    </Form>
  );
};


export { Provider as StatementOfEarningsPage };
Then the wrapper is like all the other wrappers for each form. Lemme now give you the form that works the most, i mean the one that gives me the least amount of bugs and the one whose hooks and stuff you should use as the standard, cause in terms of saving data to local storage and other things, this is the one that does everything i want the other forms to do…only issue is that this form is havingg issues with data normalization of input in local storage and what schema actually asks for ..
public-liability:, under public liability, we have the first section which is insured-details, inside insured details, we have a hook folder containing a useStore.ts and this is the file:// src/features/.../insured-details/hooks/useStore.ts
import { defaultValues, Schema, schema } from "../types/schema"; // <-- include schema
import { createStore } from "@/utils/createStore";
import { persistStore } from "@/features/multistep-forms/forms/utils/localStorage";
import { normalizeFormData } from "@/utils/normalizeData";
import { DeepPartial } from "react-hook-form";
 // <-- import

type State = {
  formData: Schema;
};

const key = "insured-details";


const { getInitialState: _get, persistState } = persistStore<Schema>(key, defaultValues);

const getInitialState = (): Schema => {
  try {
    const raw = _get();
    return normalizeFormData(raw, schema);
  } catch (error) {
    console.warn("🛑 Failed to load or normalize persisted form data. Falling back to defaults.", error);
    return defaultValues;
  }
};

type Actions = {
  updateFormData: (data: DeepPartial<Schema>) => void;
  clearFormData: () => void;
};

type Store = State & Actions;

const useStore = createStore<Store>(
  (set, get) => ({
    formData: getInitialState(),
    fileObjects: {},

    updateFormData: (data) =>
      set((state) => {
        const cleanedData: Record<string, any> = { ...data };
        const fileData: Record<string, any> = {};

        // Separate file objects from regular data
        for (const key in cleanedData) {
          const val = cleanedData[key];
          if (val instanceof File) {
            fileData[key] = val;
            delete cleanedData[key]; // don't persist File in localStorage
          }
        }

        // Merge with existing data
        const updated = { ...state.formData, ...cleanedData };
     

        // Persist only non-file data
        try {
          persistState(updated);
        } catch (error) {
          console.warn('Failed to persist form data:', error);
        }

        return {
          formData: updated,
   
        };
      }),

    clearFormData: () =>
      set(() => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        return {
          formData: defaultValues,
          fileObjects: {},
        };
      }),
  }),
  {
    name: "public-liability-insured-details-store",
  }
);

export { useStore };
...then outside the hooks, we have the types folder containing the schema.ts: import { z } from "zod";

export const schema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  coverPeriodFrom: z.date({
    required_error: "Cover period start date is required",
    invalid_type_error: "Invalid date format",
  }),
  coverPeriodTo: z.date({
    required_error: "Cover period end date is required",
    invalid_type_error: "Invalid date format",
  }),
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  alertPreference: z.enum(["Email", "SMS", "Both"], {
    required_error: "Alert preference is required",
  }),
});

export type Schema = z.infer<typeof schema>;

export const defaultValues: Schema = {
  policyNumber: "",
  coverPeriodFrom: new Date(),
  coverPeriodTo: new Date(),
  companyName: "",
  address: "",
  phone: "",
  email: "",
  alertPreference: "Email",
}; ....outside the types, we have the page.tsx in the root of the insured-deatils folder : import { Form } from "@/features/form/components/form";
import { schema, Schema } from "./types/schema";
import { d } from "@/utils/publicLiabilityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";

import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";


const Page = () => {
  const { updateFormData } = useStore();

  useAutoSaveForm<Schema>({ update: updateFormData });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label={d.policyNumber}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <DatePicker<Schema>
          name="coverPeriodFrom"
          label={d.coverPeriodFrom}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <DatePicker<Schema>
          name="coverPeriodTo"
          label={d.coverPeriodTo}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label={d.address}
          multiline
          rows={3}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="phone"
          label={d.phone}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="email"
          label={d.email}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="body2" gutterBottom>
          {d.alertPreferenceDescription}
        </Typography>
        <Menu<Schema>
          name="alertPreference"
          label={d.alertPreference}
          options={d.alertPreferenceOptions.map((option) => ({
            value: option,
            label: option,
          }))}
        />
      </Grid>
    </Grid>
  );
};

const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();

  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../details-of-loss");
  };

  return (
    <Form
      schema={schema}
      defaultValues={formData}
      // values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.insuredDetails}
      readOnly={readOnly}
    >
      <Page />
    </Form>
  );
};

export { Provider as PublicLiabilityInsuredDetails };
export { Page as InsuredDetails }; ...then the next section is the details-of-loss, the hook folder of that one has this useStore: import { defaultValues, Schema, schema } from "../types/schema";
import { createStore } from "@/utils/createStore";
import { persistStore } from "@/features/multistep-forms/forms/utils/localStorage";
import { DeepPartial } from "react-hook-form";
import { normalizeFormData } from "@/utils/normalizeData";

type State = {
  formData: Schema;
  fileObjects: Partial<Schema>; // NEW
};

const key = "details-of-loss"; // or "particulars-of-claimant", etc.

const { getInitialState: _get, persistState } = persistStore<Schema>(key, defaultValues);

const getInitialState = (): Schema => {
  try {
    const raw = _get();
    return normalizeFormData(raw, schema);
  } catch (error) {
    console.warn("🛑 Failed to load or normalize persisted form data. Falling back to defaults.", error);
    return defaultValues;
  }
};


type Actions = {
  updateFormData: (data: DeepPartial<Schema>) => void;
  clearFormData: () => void;
};

type Store = State & Actions;

const useStore = createStore<Store>(
  (set, get) => ({
    formData: getInitialState(),
    fileObjects: {},

    updateFormData: (data) =>
      set((state) => {
        const cleanedData: Record<string, any> = { ...data };
        const fileData: Record<string, any> = {};

        // Separate file objects from regular data
        for (const key in cleanedData) {
          const val = cleanedData[key];
          if (val instanceof File) {
            fileData[key] = val;
            delete cleanedData[key]; // don't persist File in localStorage
          }
        }

        // Merge with existing data
        const updated = { ...state.formData, ...cleanedData };
        const updatedFiles = { ...state.fileObjects, ...fileData };

        // Persist only non-file data
        try {
          persistState(updated);
        } catch (error) {
          console.warn('Failed to persist form data:', error);
        }

        return {
          formData: updated,
          fileObjects: updatedFiles,
        };
      }),

    clearFormData: () =>
      set(() => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        return {
          formData: defaultValues,
          fileObjects: {},
        };
      }),
  }),
  {
    name: "public-liability-details-of-loss-store", // or whichever section
  }
);

export { useStore };
...then the types/schema is :import { z } from "zod";

const witnessSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  employmentStatus: z.enum(["Employee", "Independent"], {
    required_error: "Employment status is required",
  }),
});

export const schema = z.object({
  accidentDateTime: z.date({
    required_error: "Accident date and time is required",
    invalid_type_error: "Invalid date format",
  }),
  accidentLocation: z.string().min(1, "Accident location is required"),
  accidentDetails: z.string().min(1, "Accident details are required"),
  witnesses: z.array(witnessSchema),
  workDescription: z.string().min(1, "Work description is required"),
  responsiblePersonName: z.string().min(1, "Name of responsible person is required"),
  responsiblePersonAddress: z.string().min(1, "Address of responsible person is required"),
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  policeNotified: z.boolean(),
  policeOfficerNumber: z.string().optional(),
  policeStation: z.string().optional(),
  otherPolicies: z.boolean(),
  otherPoliciesDetails: z.string().optional(),
  claimantName: z.string().min(1, "Claimant name is required"),
  claimantAddress: z.string().min(1, "Claimant address is required"),
  injuryOrDamageNature: z.string().min(1, "Nature of injury or damage is required"),
  claimNoticeReceived: z.boolean(),
  claimNoticeDetails: z.string().optional(),
  claimDocuments: z.union([
    z.instanceof(File),
    z.object({
      url: z.string(),
      name: z.string().optional(),
      type: z.string().optional(),
    })
  ]).optional(),
  
});

export type Schema = z.infer<typeof schema>;

export const defaultValues: Schema = {
  accidentDateTime: new Date(),
  accidentLocation: "",
  accidentDetails: "",
  witnesses: [],
  workDescription: "",
  responsiblePersonName: "",
  responsiblePersonAddress: "",
  employerName: "",
  employerAddress: "",
  policeNotified: false,
  policeOfficerNumber: "",
  policeStation: "",
  otherPolicies: false,
  otherPoliciesDetails: "",
  claimantName: "",
  claimantAddress: "",
  injuryOrDamageNature: "",
  claimNoticeReceived: false,
  claimNoticeDetails: "",
  claimDocuments: undefined,
}; ...the page.tsx: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/publicLiabilityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFieldArray, useWatch } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Chip, IconButton, Typography } from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Fragment } from "react";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";

type PageProps = {
  readOnly?: boolean;
};

const Page = ({ readOnly }: PageProps) => {
  const { updateFormData } = useStore();

  useAutoSaveForm<Schema>({ update: updateFormData });
  const { control } = useFormContext<Schema>();

  const policeNotified = useWatch({
    control,
    name: "policeNotified",
  });

  const otherPolicies = useWatch({
    control,
    name: "otherPolicies",
  });

  const claimNoticeReceived = useWatch({
    control,
    name: "claimNoticeReceived",
  });

  const {
    fields: witnessFields,
    append: appendWitness,
    remove: removeWitness,
  } = useFieldArray({
    control,
    name: "witnesses",
  });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DatePicker<Schema>
          name="accidentDateTime"
          label={d.accidentDateTime}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="accidentLocation"
          label={d.accidentLocation}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="accidentDetails"
          label={d.accidentDetails}
        />
      </Grid>

      <Grid
        sx={{ display: "flex", alignItems: "center" }}
        size={12}
        id="witnesses"
      >
        <Typography variant="subtitle2">{d.witnesses}:</Typography>
        {!readOnly && (
          <IconButton
            onClick={() =>
              appendWitness({
                name: "",
                address: "",
                employmentStatus: "Employee",
              })
            }
            color="success"
          >
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {witnessFields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={{ xs: 12 }}
          >
            <Chip
              label={`${d.witnessName} #${index + 1}:`}
              size="small"
              color="secondary"
            />
            {!readOnly && (
              <IconButton
                color="error"
                onClick={() => removeWitness(index)}
              >
                <RemoveCircleOutlineRoundedIcon />
              </IconButton>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField<Schema>
              name={`witnesses.${index}.name`}
              label={d.witnessName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField<Schema>
              name={`witnesses.${index}.address`}
              label={d.witnessAddress}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Menu<Schema>
              name={`witnesses.${index}.employmentStatus`}
              label={d.employmentStatus}
              options={d.employmentStatusOptions.map((option) => ({
                value: option,
                label: option,
              }))}
            />
          </Grid>
        </Fragment>
      ))}

      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="workDescription"
          label={d.workDescription}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="responsiblePersonName"
          label={d.responsiblePersonName}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="responsiblePersonAddress"
          label={d.responsiblePersonAddress}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="employerName"
          label={d.employerName}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="employerAddress"
          label={d.employerAddress}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="policeNotified"
          label={d.policeNotified}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>

      {policeNotified && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="policeOfficerNumber"
              label={d.policeOfficerNumber}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="policeStation"
              label={d.policeStation}
            />
          </Grid>
        </>
      )}

      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="otherPolicies"
          label={d.otherPolicies}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>

      {otherPolicies && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="otherPoliciesDetails"
            label={d.otherPoliciesDetails}
          />
        </Grid>
      )}

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="claimantName"
          label={d.claimantName}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="claimantAddress"
          label={d.claimantAddress}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="injuryOrDamageNature"
          label={d.injuryOrDamageNature}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="claimNoticeReceived"
          label={d.claimNoticeReceived}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>

      {claimNoticeReceived && (
        <>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="claimNoticeDetails"
              label={d.claimNoticeDetails}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" gutterBottom>
              {d.claimDocumentsNote}
            </Typography>
            <FileUpload<Schema>
              name="claimDocuments"
              label={d.claimDocuments}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

type ProviderProps = {
  readOnly?: boolean;
  hideSubmitButton?: boolean;
};

const Provider = ({ readOnly, hideSubmitButton }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, fileObjects, updateFormData } = useStore();

  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/public-liability/particulars-of-claimant");

  };

  return (
    <Form
      schema={schema}
      defaultValues={{ ...formData, ...fileObjects }}
      // values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.detailsOfLoss}
      readOnly={readOnly}
 
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};

export { Provider as PublicLiabilityDetailsOfLoss };
export { Page as DetailsOfLoss };
export type { PageProps as DetailsOfLossProps }; ....then the next section is particulars-of-claimant, the hooks/useStore: import { defaultValues, Schema, schema } from "../types/schema";
import { createStore } from "@/utils/createStore";
import { persistStore } from "@/features/multistep-forms/forms/utils/localStorage";
import { DeepPartial } from "react-hook-form";
import { normalizeFormData } from "@/utils/normalizeData";

type State = {
  formData: Schema;
  fileObjects: Partial<Schema>; 
};

const key = "particulars-of-claimant";

const { getInitialState: _get, persistState } = persistStore<Schema>(key, defaultValues);

const getInitialState = (): Schema => {
  try {
    const raw = _get();
    return normalizeFormData(raw, schema);
  } catch (error) {
    console.warn("🛑 Failed to load or normalize persisted form data. Falling back to defaults.", error);
    return defaultValues;
  }
};


type Actions = {
  updateFormData: (data: DeepPartial<Schema>) => void;
  clearFormData: () => void;
};

type Store = State & Actions;

const useStore = createStore<Store>(
  (set, get) => ({
    formData: getInitialState(),
    fileObjects: {},

    updateFormData: (data) =>
      set((state) => {
        const cleanedData: Record<string, any> = { ...data };
        const fileData: Record<string, any> = {};

        // Separate file objects from regular data
        for (const key in cleanedData) {
          const val = cleanedData[key];
          if (val instanceof File) {
            fileData[key] = val;
            delete cleanedData[key]; // don't persist File in localStorage
          }
        }

        // Merge with existing data
        const updated = { ...state.formData, ...cleanedData };
        const updatedFiles = { ...state.fileObjects, ...fileData };

        // Persist only non-file data
        try {
          persistState(updated);
        } catch (error) {
          console.warn('Failed to persist form data:', error);
        }

        return {
          formData: updated,
          fileObjects: updatedFiles,
        };
      }),

    clearFormData: () =>
      set(() => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        return {
          formData: defaultValues,
          fileObjects: {},
        };
      }),
  }),
  {
    name: "public-liability-particulars-of-claimant-store",
  }
);

export { useStore };
....the types/schema:import { z } from "zod";

const baseSchema = z.object({
  claimantName: z.string().min(1, "Name of claimant is required"),
  claimFromWhom: z.string().min(1, "From whom is required"),
  claimWhen: z.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date format",
  }),
  claimInWhatForm: z.string().min(1, "Form of claim is required"),
  isClaimInWriting: z.boolean(),
  claimWrittenForm:  z.union([
    z.instanceof(File),
    z.object({
      url: z.string(),
      name: z.string().optional(),
      type: z.string().optional(),
    })
  ]).optional(),
  
});

export const schema = baseSchema.refine(
  (data) => data.isClaimInWriting === false || data.claimWrittenForm,
  {
    path: ["claimWrittenForm"],
    message: "Please upload the written claim form",
  }
);

export type Schema = z.infer<typeof schema>;

export const defaultValues: Schema = {
  claimantName: "",
  claimFromWhom: "",
  claimWhen: new Date(),
  claimInWhatForm: "",
  isClaimInWriting: false,
  claimWrittenForm: undefined,
};

export { baseSchema }; ...the page.tsx is :import { a as Router, b as RouteModules, D as DataStrategyFunction, T as To, c as RelativeRoutingType, L as Location, A as Action, P as ParamParseKey, d as Path, e as PathPattern, f as PathMatch, N as NavigateOptions, g as Params, h as RouteObject, i as Navigation, U as UIMatch, S as SerializeFrom, B as BlockerFunction, j as Blocker, k as StaticHandlerContext, l as StaticHandler, F as FutureConfig, C as CreateStaticHandlerOptions$1, I as InitialEntry, H as HydrationState, u as unstable_InitialContext, m as IndexRouteObject, n as NonIndexRouteObject, o as LoaderFunction, p as ActionFunction, M as MetaFunction, q as LinksFunction, r as MiddlewareEnabled, s as AppLoadContext, E as Equal, t as RouterState, v as PatchRoutesOnNavigationFunction, w as DataRouteObject, x as ClientLoaderFunction } from './route-data-WyrduLgj.mjs';
export { W as ActionFunctionArgs, av as ClientActionFunction, aw as ClientActionFunctionArgs, ax as ClientLoaderFunctionArgs, ar as DataRouteMatch, X as DataStrategyFunctionArgs, Y as DataStrategyMatch, Z as DataStrategyResult, $ as ErrorResponse, z as Fetcher, a0 as FormEncType, a1 as FormMethod, aF as Future, G as GetScrollPositionFunction, y as GetScrollRestorationKeyFunction, a2 as HTMLFormMethod, ay as HeadersArgs, az as HeadersFunction, aD as HtmlLinkDescriptor, ah as IDLE_BLOCKER, ag as IDLE_FETCHER, af as IDLE_NAVIGATION, a3 as LazyRouteFunction, aE as LinkDescriptor, a4 as LoaderFunctionArgs, aA as MetaArgs, aB as MetaDescriptor, J as NavigationStates, as as Navigator, aC as PageLinkDescriptor, at as PatchRoutesOnNavigationFunctionArgs, a6 as PathParam, a7 as RedirectFunction, V as RevalidationState, au as RouteMatch, Q as RouterFetchOptions, R as RouterInit, O as RouterNavigateOptions, K as RouterSubscriber, a9 as ShouldRevalidateFunction, aa as ShouldRevalidateFunctionArgs, aL as UNSAFE_DataRouterContext, aM as UNSAFE_DataRouterStateContext, _ as UNSAFE_DataWithResponseInit, aK as UNSAFE_ErrorResponseImpl, aN as UNSAFE_FetchersContext, aO as UNSAFE_LocationContext, aP as UNSAFE_NavigationContext, aQ as UNSAFE_RouteContext, aR as UNSAFE_ViewTransitionContext, aH as UNSAFE_createBrowserHistory, aJ as UNSAFE_createRouter, aI as UNSAFE_invariant, ad as createPath, ai as data, aj as generatePath, ak as isRouteErrorResponse, al as matchPath, am as matchRoutes, ae as parsePath, an as redirect, ao as redirectDocument, ap as replace, aq as resolvePath, a5 as unstable_MiddlewareFunction, a8 as unstable_RouterContext, ac as unstable_RouterContextProvider, aG as unstable_SerializesTo, ab as unstable_createContext } from './route-data-WyrduLgj.mjs';
import { A as AssetsManifest, E as EntryContext, F as FutureConfig$1, S as ServerBuild } from './lib-B8x_tOvL.mjs';
export { f as Await, a as AwaitProps, Q as BrowserRouter, B as BrowserRouterProps, D as DOMRouterOpts, v as FetcherFormProps, C as FetcherSubmitFunction, a6 as FetcherSubmitOptions, G as FetcherWithComponents, X as Form, w as FormProps, ah as HandleDataRequestFunction, ai as HandleDocumentRequestFunction, aj as HandleErrorFunction, T as HashRouter, H as HashRouterProps, q as HistoryRouterProps, I as IndexRouteProps, L as LayoutRouteProps, U as Link, s as LinkProps, ad as Links, g as MemoryRouter, M as MemoryRouterOpts, b as MemoryRouterProps, ac as Meta, W as NavLink, t as NavLinkProps, u as NavLinkRenderProps, h as Navigate, N as NavigateProps, i as Outlet, O as OutletProps, a7 as ParamKeyValuePair, P as PathRouteProps, af as PrefetchPageLinks, j as Route, c as RouteProps, k as Router, d as RouterProps, l as RouterProvider, R as RouterProviderProps, m as Routes, e as RoutesProps, ae as Scripts, ag as ScriptsProps, Y as ScrollRestoration, x as ScrollRestorationProps, ak as ServerEntryModule, y as SetURLSearchParams, z as SubmitFunction, a8 as SubmitOptions, aa as SubmitTarget, an as UNSAFE_FrameworkContext, ao as UNSAFE_createClientRoutes, ap as UNSAFE_createClientRoutesWithHMRRevalidationOptOut, al as UNSAFE_hydrationRouteProperties, am as UNSAFE_mapRouteProperties, aq as UNSAFE_shouldHydrateRouteLoader, ar as UNSAFE_useScrollRestoration, a9 as URLSearchParamsInit, J as createBrowserRouter, K as createHashRouter, n as createMemoryRouter, o as createRoutesFromChildren, p as createRoutesFromElements, ab as createSearchParams, r as renderMatches, V as unstable_HistoryRouter, a4 as unstable_usePrompt, a3 as useBeforeUnload, a1 as useFetcher, a2 as useFetchers, a0 as useFormAction, Z as useLinkClickHandler, _ as useSearchParams, $ as useSubmit, a5 as useViewTransitionState } from './lib-B8x_tOvL.mjs';
import * as React from 'react';
import { ReactElement } from 'react';
import { ParseOptions, SerializeOptions } from 'cookie';
export { ParseOptions as CookieParseOptions, SerializeOptions as CookieSerializeOptions } from 'cookie';
import { P as Pages } from './register-DeIo2iHO.mjs';
export { R as Register } from './register-DeIo2iHO.mjs';

declare const SingleFetchRedirectSymbol: unique symbol;
declare function getTurboStreamSingleFetchDataStrategy(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, basename: string | undefined): DataStrategyFunction;
declare function decodeViaTurboStream(body: ReadableStream<Uint8Array>, global: Window | typeof globalThis): Promise<{
    done: Promise<undefined>;
    value: unknown;
}>;

/**
 * The mode to use when running the server.
 */
declare enum ServerMode {
    Development = "development",
    Production = "production",
    Test = "test"
}

/**
  Resolves a URL against the current location.

  ```tsx
  import { useHref } from "react-router"

  function SomeComponent() {
    let href = useHref("some/where");
    // "/resolved/some/where"
  }
  ```

  @category Hooks
 */
declare function useHref(to: To, { relative }?: {
    relative?: RelativeRoutingType;
}): string;
/**
 * Returns true if this component is a descendant of a Router, useful to ensure
 * a component is used within a Router.
 *
 * @category Hooks
 */
declare function useInRouterContext(): boolean;
/**
  Returns the current {@link Location}. This can be useful if you'd like to perform some side effect whenever it changes.

  ```tsx
  import * as React from 'react'
  import { useLocation } from 'react-router'

  function SomeComponent() {
    let location = useLocation()

    React.useEffect(() => {
      // Google Analytics
      ga('send', 'pageview')
    }, [location]);

    return (
      // ...
    );
  }
  ```

  @category Hooks
 */
declare function useLocation(): Location;
/**
 * Returns the current navigation action which describes how the router came to
 * the current location, either by a pop, push, or replace on the history stack.
 *
 * @category Hooks
 */
declare function useNavigationType(): Action;
/**
 * Returns a PathMatch object if the given pattern matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * `<NavLink>`.
 *
 * @category Hooks
 */
declare function useMatch<ParamKey extends ParamParseKey<Path>, Path extends string>(pattern: PathPattern<Path> | Path): PathMatch<ParamKey> | null;
/**
 * The interface for the navigate() function returned from useNavigate().
 */
interface NavigateFunction {
    (to: To, options?: NavigateOptions): void | Promise<void>;
    (delta: number): void | Promise<void>;
}
/**
  Returns a function that lets you navigate programmatically in the browser in response to user interactions or effects.

  ```tsx
  import { useNavigate } from "react-router";

  function SomeComponent() {
    let navigate = useNavigate();
    return (
      <button
        onClick={() => {
          navigate(-1);
        }}
      />
    );
  }
  ```

  It's often better to use {@link redirect} in {@link ActionFunction | actions} and {@link LoaderFunction | loaders} than this hook.

  @category Hooks
 */
declare function useNavigate(): NavigateFunction;
/**
 * Returns the parent route {@link OutletProps.context | `<Outlet context>`}.
 *
 * @category Hooks
 */
declare function useOutletContext<Context = unknown>(): Context;
/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by `<Outlet>` to render child routes.
 *
 * @category Hooks
 */
declare function useOutlet(context?: unknown): React.ReactElement | null;
/**
  Returns an object of key/value pairs of the dynamic params from the current URL that were matched by the routes. Child routes inherit all params from their parent routes.

  ```tsx
  import { useParams } from "react-router"

  function SomeComponent() {
    let params = useParams()
    params.postId
  }
  ```

  Assuming a route pattern like `/posts/:postId` is matched by `/posts/123` then `params.postId` will be `"123"`.

  @category Hooks
 */
declare function useParams<ParamsOrKey extends string | Record<string, string | undefined> = string>(): Readonly<[
    ParamsOrKey
] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>>;
/**
  Resolves the pathname of the given `to` value against the current location. Similar to {@link useHref}, but returns a {@link Path} instead of a string.

  ```tsx
  import { useResolvedPath } from "react-router"

  function SomeComponent() {
    // if the user is at /dashboard/profile
    let path = useResolvedPath("../accounts")
    path.pathname // "/dashboard/accounts"
    path.search // ""
    path.hash // ""
  }
  ```

  @category Hooks
 */
declare function useResolvedPath(to: To, { relative }?: {
    relative?: RelativeRoutingType;
}): Path;
/**
  Hook version of {@link Routes | `<Routes>`} that uses objects instead of components. These objects have the same properties as the component props.

  The return value of `useRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

  ```tsx
  import * as React from "react";
  import { useRoutes } from "react-router";

  function App() {
    let element = useRoutes([
      {
        path: "/",
        element: <Dashboard />,
        children: [
          {
            path: "messages",
            element: <DashboardMessages />,
          },
          { path: "tasks", element: <DashboardTasks /> },
        ],
      },
      { path: "team", element: <AboutPage /> },
    ]);

    return element;
  }
  ```

 @category Hooks
 */
declare function useRoutes(routes: RouteObject[], locationArg?: Partial<Location> | string): React.ReactElement | null;
/**
  Returns the current navigation, defaulting to an "idle" navigation when no navigation is in progress. You can use this to render pending UI (like a global spinner) or read FormData from a form navigation.

  ```tsx
  import { useNavigation } from "react-router"

  function SomeComponent() {
    let navigation = useNavigation();
    navigation.state
    navigation.formData
    // etc.
  }
  ```

  @category Hooks
 */
declare function useNavigation(): Navigation;
/**
  Revalidate the data on the page for reasons outside of normal data mutations like window focus or polling on an interval.

  ```tsx
  import { useRevalidator } from "react-router";

  function WindowFocusRevalidator() {
    const revalidator = useRevalidator();

    useFakeWindowFocus(() => {
      revalidator.revalidate();
    });

    return (
      <div hidden={revalidator.state === "idle"}>
        Revalidating...
      </div>
    );
  }
  ```

  Note that page data is already revalidated automatically after actions. If you find yourself using this for normal CRUD operations on your data in response to user interactions, you're probably not taking advantage of the other APIs like {@link useFetcher}, {@link Form}, {@link useSubmit} that do this automatically.

  @category Hooks
 */
declare function useRevalidator(): {
    revalidate: () => Promise<void>;
    state: Router["state"]["revalidation"];
};
/**
 * Returns the active route matches, useful for accessing loaderData for
 * parent/child routes or the route "handle" property
 *
 * @category Hooks
 */
declare function useMatches(): UIMatch[];
/**
  Returns the data from the closest route {@link LoaderFunction | loader} or {@link ClientLoaderFunction | client loader}.

  ```tsx
  import { useLoaderData } from "react-router"

  export async function loader() {
    return await fakeDb.invoices.findAll();
  }

  export default function Invoices() {
    let invoices = useLoaderData<typeof loader>();
    // ...
  }
  ```

  @category Hooks
 */
declare function useLoaderData<T = any>(): SerializeFrom<T>;
/**
  Returns the loader data for a given route by route ID.

  ```tsx
  import { useRouteLoaderData } from "react-router";

  function SomeComponent() {
    const { user } = useRouteLoaderData("root");
  }
  ```

  Route IDs are created automatically. They are simply the path of the route file relative to the app folder without the extension.

  | Route Filename             | Route ID             |
  | -------------------------- | -------------------- |
  | `app/root.tsx`             | `"root"`             |
  | `app/routes/teams.tsx`     | `"routes/teams"`     |
  | `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |

  If you created an ID manually, you can use that instead:

  ```tsx
  route("/", "containers/app.tsx", { id: "app" }})
  ```

  @category Hooks
 */
declare function useRouteLoaderData<T = any>(routeId: string): SerializeFrom<T> | undefined;
/**
  Returns the action data from the most recent POST navigation form submission or `undefined` if there hasn't been one.

  ```tsx
  import { Form, useActionData } from "react-router"

  export async function action({ request }) {
    const body = await request.formData()
    const name = body.get("visitorsName")
    return { message: `Hello, ${name}` }
  }

  export default function Invoices() {
    const data = useActionData()
    return (
      <Form method="post">
        <input type="text" name="visitorsName" />
        {data ? data.message : "Waiting..."}
      </Form>
    )
  }
  ```

  @category Hooks
 */
declare function useActionData<T = any>(): SerializeFrom<T> | undefined;
/**
  Accesses the error thrown during an {@link ActionFunction | action}, {@link LoaderFunction | loader}, or component render to be used in a route module Error Boundary.

  ```tsx
  export function ErrorBoundary() {
    const error = useRouteError();
    return <div>{error.message}</div>;
  }
  ```

  @category Hooks
 */
declare function useRouteError(): unknown;
/**
  Returns the resolved promise value from the closest {@link Await | `<Await>`}.

  ```tsx
  function SomeDescendant() {
    const value = useAsyncValue();
    // ...
  }

  // somewhere in your app
  <Await resolve={somePromise}>
    <SomeDescendant />
  </Await>
  ```

  @category Hooks
 */
declare function useAsyncValue(): unknown;
/**
  Returns the rejection value from the closest {@link Await | `<Await>`}.

  ```tsx
  import { Await, useAsyncError } from "react-router"

  function ErrorElement() {
    const error = useAsyncError();
    return (
      <p>Uh Oh, something went wrong! {error.message}</p>
    );
  }

  // somewhere in your app
  <Await
    resolve={promiseThatRejects}
    errorElement={<ErrorElement />}
  />
  ```

  @category Hooks
 */
declare function useAsyncError(): unknown;
/**
 * Allow the application to block navigations within the SPA and present the
 * user a confirmation dialog to confirm the navigation.  Mostly used to avoid
 * using half-filled form data.  This does not handle hard-reloads or
 * cross-origin navigations.
 *
 * @category Hooks
 */
declare function useBlocker(shouldBlock: boolean | BlockerFunction): Blocker;

interface StaticRouterProps {
    basename?: string;
    children?: React.ReactNode;
    location: Partial<Location> | string;
}
/**
 * A `<Router>` that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 *
 * @category Component Routers
 */
declare function StaticRouter({ basename, children, location: locationProp, }: StaticRouterProps): React.JSX.Element;
interface StaticRouterProviderProps {
    context: StaticHandlerContext;
    router: Router;
    hydrate?: boolean;
    nonce?: string;
}
/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 *
 * @category Component Routers
 */
declare function StaticRouterProvider({ context, router, hydrate, nonce, }: StaticRouterProviderProps): React.JSX.Element;
type CreateStaticHandlerOptions = Omit<CreateStaticHandlerOptions$1, "mapRouteProperties">;
/**
 * @category Utils
 */
declare function createStaticHandler(routes: RouteObject[], opts?: CreateStaticHandlerOptions): StaticHandler;
/**
 * @category Data Routers
 */
declare function createStaticRouter(routes: RouteObject[], context: StaticHandlerContext, opts?: {
    future?: Partial<FutureConfig>;
}): Router;

interface ServerRouterProps {
    context: EntryContext;
    url: string | URL;
    nonce?: string;
}
/**
 * The entry point for a Remix app when it is rendered on the server (in
 * `app/entry.server.js`). This component is used to generate the HTML in the
 * response from the server.
 *
 * @category Components
 */
declare function ServerRouter({ context, url, nonce, }: ServerRouterProps): ReactElement;

interface StubRouteExtensions {
    Component?: React.ComponentType<{
        params: ReturnType<typeof useParams>;
        loaderData: ReturnType<typeof useLoaderData>;
        actionData: ReturnType<typeof useActionData>;
        matches: ReturnType<typeof useMatches>;
    }>;
    HydrateFallback?: React.ComponentType<{
        params: ReturnType<typeof useParams>;
        loaderData: ReturnType<typeof useLoaderData>;
        actionData: ReturnType<typeof useActionData>;
    }>;
    ErrorBoundary?: React.ComponentType<{
        params: ReturnType<typeof useParams>;
        loaderData: ReturnType<typeof useLoaderData>;
        actionData: ReturnType<typeof useActionData>;
        error: ReturnType<typeof useRouteError>;
    }>;
    loader?: LoaderFunction;
    action?: ActionFunction;
    children?: StubRouteObject[];
    meta?: MetaFunction;
    links?: LinksFunction;
}
interface StubIndexRouteObject extends Omit<IndexRouteObject, "Component" | "HydrateFallback" | "ErrorBoundary" | "loader" | "action" | "element" | "errorElement" | "children">, StubRouteExtensions {
}
interface StubNonIndexRouteObject extends Omit<NonIndexRouteObject, "Component" | "HydrateFallback" | "ErrorBoundary" | "loader" | "action" | "element" | "errorElement" | "children">, StubRouteExtensions {
}
type StubRouteObject = StubIndexRouteObject | StubNonIndexRouteObject;
interface RoutesTestStubProps {
    /**
     *  The initial entries in the history stack. This allows you to start a test with
     *  multiple locations already in the history stack (for testing a back navigation, etc.)
     *  The test will default to the last entry in initialEntries if no initialIndex is provided.
     *  e.g. initialEntries={["/home", "/about", "/contact"]}
     */
    initialEntries?: InitialEntry[];
    /**
     * The initial index in the history stack to render. This allows you to start a test at a specific entry.
     * It defaults to the last entry in initialEntries.
     * e.g.
     *   initialEntries: ["/", "/events/123"]
     *   initialIndex: 1 // start at "/events/123"
     */
    initialIndex?: number;
    /**
     *  Used to set the route's initial loader and action data.
     *  e.g. hydrationData={{
     *   loaderData: { "/contact": { locale: "en-US" } },
     *   actionData: { "/login": { errors: { email: "invalid email" } }}
     *  }}
     */
    hydrationData?: HydrationState;
    /**
     * Future flags mimicking the settings in react-router.config.ts
     */
    future?: Partial<FutureConfig$1>;
}
/**
 * @category Utils
 */
declare function createRoutesStub(routes: StubRouteObject[], unstable_getContext?: () => unstable_InitialContext): ({ initialEntries, initialIndex, hydrationData, future, }: RoutesTestStubProps) => React.JSX.Element;

interface CookieSignatureOptions {
    /**
     * An array of secrets that may be used to sign/unsign the value of a cookie.
     *
     * The array makes it easy to rotate secrets. New secrets should be added to
     * the beginning of the array. `cookie.serialize()` will always use the first
     * value in the array, but `cookie.parse()` may use any of them so that
     * cookies that were signed with older secrets still work.
     */
    secrets?: string[];
}
type CookieOptions = ParseOptions & SerializeOptions & CookieSignatureOptions;
/**
 * A HTTP cookie.
 *
 * A Cookie is a logical container for metadata about a HTTP cookie; its name
 * and options. But it doesn't contain a value. Instead, it has `parse()` and
 * `serialize()` methods that allow a single instance to be reused for
 * parsing/encoding multiple different values.
 *
 * @see https://remix.run/utils/cookies#cookie-api
 */
interface Cookie {
    /**
     * The name of the cookie, used in the `Cookie` and `Set-Cookie` headers.
     */
    readonly name: string;
    /**
     * True if this cookie uses one or more secrets for verification.
     */
    readonly isSigned: boolean;
    /**
     * The Date this cookie expires.
     *
     * Note: This is calculated at access time using `maxAge` when no `expires`
     * option is provided to `createCookie()`.
     */
    readonly expires?: Date;
    /**
     * Parses a raw `Cookie` header and returns the value of this cookie or
     * `null` if it's not present.
     */
    parse(cookieHeader: string | null, options?: ParseOptions): Promise<any>;
    /**
     * Serializes the given value to a string and returns the `Set-Cookie`
     * header.
     */
    serialize(value: any, options?: SerializeOptions): Promise<string>;
}
/**
 * Creates a logical container for managing a browser cookie from the server.
 */
declare const createCookie: (name: string, cookieOptions?: CookieOptions) => Cookie;
type IsCookieFunction = (object: any) => object is Cookie;
/**
 * Returns true if an object is a Remix cookie container.
 *
 * @see https://remix.run/utils/cookies#iscookie
 */
declare const isCookie: IsCookieFunction;

type RequestHandler = (request: Request, loadContext?: MiddlewareEnabled extends true ? unstable_InitialContext : AppLoadContext) => Promise<Response>;
type CreateRequestHandlerFunction = (build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>), mode?: string) => RequestHandler;
declare const createRequestHandler: CreateRequestHandlerFunction;

/**
 * An object of name/value pairs to be used in the session.
 */
interface SessionData {
    [name: string]: any;
}
/**
 * Session persists data across HTTP requests.
 *
 * @see https://reactrouter.com/explanation/sessions-and-cookies#sessions
 */
interface Session<Data = SessionData, FlashData = Data> {
    /**
     * A unique identifier for this session.
     *
     * Note: This will be the empty string for newly created sessions and
     * sessions that are not backed by a database (i.e. cookie-based sessions).
     */
    readonly id: string;
    /**
     * The raw data contained in this session.
     *
     * This is useful mostly for SessionStorage internally to access the raw
     * session data to persist.
     */
    readonly data: FlashSessionData<Data, FlashData>;
    /**
     * Returns `true` if the session has a value for the given `name`, `false`
     * otherwise.
     */
    has(name: (keyof Data | keyof FlashData) & string): boolean;
    /**
     * Returns the value for the given `name` in this session.
     */
    get<Key extends (keyof Data | keyof FlashData) & string>(name: Key): (Key extends keyof Data ? Data[Key] : undefined) | (Key extends keyof FlashData ? FlashData[Key] : undefined) | undefined;
    /**
     * Sets a value in the session for the given `name`.
     */
    set<Key extends keyof Data & string>(name: Key, value: Data[Key]): void;
    /**
     * Sets a value in the session that is only valid until the next `get()`.
     * This can be useful for temporary values, like error messages.
     */
    flash<Key extends keyof FlashData & string>(name: Key, value: FlashData[Key]): void;
    /**
     * Removes a value from the session.
     */
    unset(name: keyof Data & string): void;
}
type FlashSessionData<Data, FlashData> = Partial<Data & {
    [Key in keyof FlashData as FlashDataKey<Key & string>]: FlashData[Key];
}>;
type FlashDataKey<Key extends string> = `__flash_${Key}__`;
type CreateSessionFunction = <Data = SessionData, FlashData = Data>(initialData?: Data, id?: string) => Session<Data, FlashData>;
/**
 * Creates a new Session object.
 *
 * Note: This function is typically not invoked directly by application code.
 * Instead, use a `SessionStorage` object's `getSession` method.
 */
declare const createSession: CreateSessionFunction;
type IsSessionFunction = (object: any) => object is Session;
/**
 * Returns true if an object is a React Router session.
 *
 * @see https://reactrouter.com/api/utils/isSession
 */
declare const isSession: IsSessionFunction;
/**
 * SessionStorage stores session data between HTTP requests and knows how to
 * parse and create cookies.
 *
 * A SessionStorage creates Session objects using a `Cookie` header as input.
 * Then, later it generates the `Set-Cookie` header to be used in the response.
 */
interface SessionStorage<Data = SessionData, FlashData = Data> {
    /**
     * Parses a Cookie header from a HTTP request and returns the associated
     * Session. If there is no session associated with the cookie, this will
     * return a new Session with no data.
     */
    getSession: (cookieHeader?: string | null, options?: ParseOptions) => Promise<Session<Data, FlashData>>;
    /**
     * Stores all data in the Session and returns the Set-Cookie header to be
     * used in the HTTP response.
     */
    commitSession: (session: Session<Data, FlashData>, options?: SerializeOptions) => Promise<string>;
    /**
     * Deletes all data associated with the Session and returns the Set-Cookie
     * header to be used in the HTTP response.
     */
    destroySession: (session: Session<Data, FlashData>, options?: SerializeOptions) => Promise<string>;
}
/**
 * SessionIdStorageStrategy is designed to allow anyone to easily build their
 * own SessionStorage using `createSessionStorage(strategy)`.
 *
 * This strategy describes a common scenario where the session id is stored in
 * a cookie but the actual session data is stored elsewhere, usually in a
 * database or on disk. A set of create, read, update, and delete operations
 * are provided for managing the session data.
 */
interface SessionIdStorageStrategy<Data = SessionData, FlashData = Data> {
    /**
     * The Cookie used to store the session id, or options used to automatically
     * create one.
     */
    cookie?: Cookie | (CookieOptions & {
        name?: string;
    });
    /**
     * Creates a new record with the given data and returns the session id.
     */
    createData: (data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<string>;
    /**
     * Returns data for a given session id, or `null` if there isn't any.
     */
    readData: (id: string) => Promise<FlashSessionData<Data, FlashData> | null>;
    /**
     * Updates data for the given session id.
     */
    updateData: (id: string, data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<void>;
    /**
     * Deletes data for a given session id from the data store.
     */
    deleteData: (id: string) => Promise<void>;
}
/**
 * Creates a SessionStorage object using a SessionIdStorageStrategy.
 *
 * Note: This is a low-level API that should only be used if none of the
 * existing session storage options meet your requirements.
 */
declare function createSessionStorage<Data = SessionData, FlashData = Data>({ cookie: cookieArg, createData, readData, updateData, deleteData, }: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<Data, FlashData>;

interface CookieSessionStorageOptions {
    /**
     * The Cookie used to store the session data on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
}
/**
 * Creates and returns a SessionStorage object that stores all session data
 * directly in the session cookie itself.
 *
 * This has the advantage that no database or other backend services are
 * needed, and can help to simplify some load-balanced scenarios. However, it
 * also has the limitation that serialized session data may not exceed the
 * browser's maximum cookie size. Trade-offs!
 */
declare function createCookieSessionStorage<Data = SessionData, FlashData = Data>({ cookie: cookieArg }?: CookieSessionStorageOptions): SessionStorage<Data, FlashData>;

interface MemorySessionStorageOptions {
    /**
     * The Cookie used to store the session id on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
}
/**
 * Creates and returns a simple in-memory SessionStorage object, mostly useful
 * for testing and as a reference implementation.
 *
 * Note: This storage does not scale beyond a single process, so it is not
 * suitable for most production scenarios.
 */
declare function createMemorySessionStorage<Data = SessionData, FlashData = Data>({ cookie }?: MemorySessionStorageOptions): SessionStorage<Data, FlashData>;

type DevServerHooks = {
    getCriticalCss?: (pathname: string) => Promise<string | undefined>;
    processRequestError?: (error: unknown) => void;
};
declare function setDevServerHooks(devServerHooks: DevServerHooks): void;

type Args = {
    [K in keyof Pages]: ToArgs<Pages[K]["params"]>;
};
type ToArgs<Params extends Record<string, string | undefined>> = Equal<Params, {}> extends true ? [] : Partial<Params> extends Params ? [Params] | [] : [
    Params
];
/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
declare function href<Path extends keyof Args>(path: Path, ...args: Args[Path]): string;

declare function deserializeErrors(errors: RouterState["errors"]): RouterState["errors"];

type RemixErrorBoundaryProps = React.PropsWithChildren<{
    location: Location;
    isOutsideRemixApp?: boolean;
    error?: Error;
}>;
type RemixErrorBoundaryState = {
    error: null | Error;
    location: Location;
};
declare class RemixErrorBoundary extends React.Component<RemixErrorBoundaryProps, RemixErrorBoundaryState> {
    constructor(props: RemixErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    static getDerivedStateFromProps(props: RemixErrorBoundaryProps, state: RemixErrorBoundaryState): {
        error: Error | null;
        location: Location<any>;
    };
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}

declare function getPatchRoutesOnNavigationFunction(manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean, basename: string | undefined): PatchRoutesOnNavigationFunction | undefined;
declare function useFogOFWarDiscovery(router: Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean): void;

declare function getHydrationData(state: {
    loaderData?: Router["state"]["loaderData"];
    actionData?: Router["state"]["actionData"];
    errors?: Router["state"]["errors"];
}, routes: DataRouteObject[], getRouteInfo: (routeId: string) => {
    clientLoader: ClientLoaderFunction | undefined;
    hasLoader: boolean;
    hasHydrateFallback: boolean;
}, location: Path, basename: string | undefined, isSpaMode: boolean): HydrationState;

export { ActionFunction, AppLoadContext, Blocker, BlockerFunction, ClientLoaderFunction, type Cookie, type CookieOptions, type CookieSignatureOptions, type CreateRequestHandlerFunction, DataRouteObject, Router as DataRouter, DataStrategyFunction, EntryContext, type FlashSessionData, HydrationState, IndexRouteObject, InitialEntry, type IsCookieFunction, type IsSessionFunction, LinksFunction, LoaderFunction, Location, MetaFunction, type NavigateFunction, NavigateOptions, Navigation, Action as NavigationType, NonIndexRouteObject, ParamParseKey, Params, PatchRoutesOnNavigationFunction, Path, PathMatch, PathPattern, RelativeRoutingType, type RequestHandler, RouteObject, RouterState, type RoutesTestStubProps, ServerBuild, ServerRouter, type ServerRouterProps, type Session, type SessionData, type SessionIdStorageStrategy, type SessionStorage, StaticHandler, StaticHandlerContext, StaticRouter, type StaticRouterProps, StaticRouterProvider, type StaticRouterProviderProps, To, UIMatch, AssetsManifest as UNSAFE_AssetsManifest, MiddlewareEnabled as UNSAFE_MiddlewareEnabled, RemixErrorBoundary as UNSAFE_RemixErrorBoundary, RouteModules as UNSAFE_RouteModules, ServerMode as UNSAFE_ServerMode, SingleFetchRedirectSymbol as UNSAFE_SingleFetchRedirectSymbol, decodeViaTurboStream as UNSAFE_decodeViaTurboStream, deserializeErrors as UNSAFE_deserializeErrors, getHydrationData as UNSAFE_getHydrationData, getPatchRoutesOnNavigationFunction as UNSAFE_getPatchRoutesOnNavigationFunction, getTurboStreamSingleFetchDataStrategy as UNSAFE_getTurboStreamSingleFetchDataStrategy, useFogOFWarDiscovery as UNSAFE_useFogOFWarDiscovery, createCookie, createCookieSessionStorage, createMemorySessionStorage, createRequestHandler, createRoutesStub, createSession, createSessionStorage, createStaticHandler, createStaticRouter, href, isCookie, isSession, unstable_InitialContext, setDevServerHooks as unstable_setDevServerHooks, useActionData, useAsyncError, useAsyncValue, useBlocker, useHref, useInRouterContext, useLoaderData, useLocation, useMatch, useMatches, useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext, useParams, useResolvedPath, useRevalidator, useRouteError, useRouteLoaderData, useRoutes };
....the review section: the hooks/useStore:import { defaultValues, Schema, schema } from "../types/schema";
import { createStore } from "@/utils/createStore";
import { persistStore } from "@/features/multistep-forms/forms/utils/localStorage";
import { normalizeFormData } from "@/utils/normalizeData";
import { DeepPartial } from "react-hook-form";

type State = {
  formData: Schema;
};
const key = "review";


const { getInitialState: _get, persistState } = persistStore<Schema>(key, defaultValues);

const getInitialState = (): Schema => {
  try {
    const raw = _get();
    return normalizeFormData(raw, schema);
  } catch (error) {
    console.warn("🛑 Failed to load or normalize persisted form data. Falling back to defaults.", error);
    return defaultValues;
  }
};

type Actions = {
  updateFormData: (data: DeepPartial<Schema>) => void;
  clearFormData: () => void;
};

type Store = State & Actions;

const useStore = createStore<Store>(
  (set, get) => ({
    formData: getInitialState(),
    fileObjects: {},

    updateFormData: (data) =>
      set((state) => {
        const cleanedData: Record<string, any> = { ...data };
        const fileData: Record<string, any> = {};

        // Separate file objects from regular data
        for (const key in cleanedData) {
          const val = cleanedData[key];
          if (val instanceof File) {
            fileData[key] = val;
            delete cleanedData[key]; // don't persist File in localStorage
          }
        }

        // Merge with existing data
        const updated = { ...state.formData, ...cleanedData };
      

        // Persist only non-file data
        try {
          persistState(updated);
        } catch (error) {
          console.warn('Failed to persist form data:', error);
        }

        return {
          formData: updated,
      
        };
      }),

    clearFormData: () =>
      set(() => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        return {
          formData: defaultValues,
          fileObjects: {},
        };
      }),
  }),
  {
    name: "public-liability-review-store",
  }
);

export { useStore }; ...the  types/schema:import { z } from "zod";

export const schema = z.object({
  // dataPrivacyAccepted: z.boolean().refine((val) => val === true, {
  //   message: "You must accept the data privacy notice",
  // }),
  // declarationAccepted: z.boolean().refine((val) => val === true, {
  //   message: "You must accept the declaration",
  // }),
  // signature: z.string().min(1, "Signature is required"),
  // signatureDate: z.date({
  //   required_error: "Date is required",
  //   invalid_type_error: "Invalid date format",
  // }),
  termsAndConditionsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type Schema = z.infer<typeof schema>;

export const defaultValues: Schema = {
  // dataPrivacyAccepted: false,
  // declarationAccepted: false,
  // signature: "",
  // signatureDate: new Date(),
  termsAndConditionsAccepted: false,
}; ....the pahge.tsx:import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/publicLiabilityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useStore as useWrapperStore } from "../wrapper/hooks/useStore";
import { Checkbox } from "@/features/form/components/controllers/checkbox";
import { Typography, Stack, Divider } from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";



const Page = () => {
  const { updateFormData } = useStore();

  useAutoSaveForm<Schema>({ update: updateFormData });
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>
            {d.dataPrivacyNotice}
          </Typography>
          <Stack spacing={2}>
            <Typography>{d.dataUsePurpose}</Typography>
            <Typography>{d.dataSecurity}</Typography>
            <Typography>{d.dataSharing}</Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            {d.declarationTitle}
          </Typography>
          <Stack spacing={2}>
            <Typography>1. {d.declarationTruthfulness}</Typography>
            <Typography>2. {d.declarationAdditionalInfo}</Typography>
            <Typography>3. {d.declarationDocuments}</Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Checkbox<Schema>
            name="termsAndConditionsAccepted"
            label={d.iAcceptTermsAndConditions}
          />
        </Grid>
      </Grid>
    </>
  );
};

const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const { updateSummaryDialogOpen } = useWrapperStore();
  const { formData, updateFormData } = useStore();

  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    updateSummaryDialogOpen(true);
  };

  return (
    <Form
      schema={schema}
      defaultValues={formData}
      // values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.review,
          startIcon: <SendOutlinedIcon />,
        },
      }}
      title={d.review}
      readOnly={readOnly}
    >
      <Page />
    </Form>
  );
};

export { Provider as PublicLiabilityReview };
export { Page as Review };
..then he wrapper folder in the root of the public-liability.. we have components/stepper: import { d } from "@/utils/publicLiabilityDictionary/dictionary";
import {
  Stepper as MuiStepper,
  Step,
  StepButton,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { useStore as useInsuredDetailsStore } from "../../insured-details/hooks/useStore";
import { useStore as useDetailsOfLossStore } from "../../details-of-loss/hooks/useStore";
import { useStore as useParticularsOfClaimantStore } from "../../particulars-of-claimant/hooks/useStore";
import { useStore as useReviewStore } from "../../review/hooks/useStore";
import { schema as insuredDetailsSchema } from "../../insured-details/types/schema";
import { schema as detailsOfLossSchema } from "../../details-of-loss/types/schema";
import { schema as particularsOfClaimantSchema } from "../../particulars-of-claimant/types/schema";
import { schema as reviewSchema } from "../../review/types/schema";

const Stepper = () => {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  const { formData: insuredDetailsFormData } = useInsuredDetailsStore();
  const { formData: detailsOfLossFormData } = useDetailsOfLossStore();
  const { formData: particularsOfClaimantFormData } = useParticularsOfClaimantStore();
  const { formData: reviewFormData } = useReviewStore();

  const { success: insuredDetailsSuccess } = insuredDetailsSchema.safeParse(insuredDetailsFormData);
  const { success: detailsOfLossSuccess } = detailsOfLossSchema.safeParse(detailsOfLossFormData);
  const { success: particularsOfClaimantSuccess } = particularsOfClaimantSchema.safeParse(particularsOfClaimantFormData);
  const { success: reviewSuccess } = reviewSchema.safeParse(reviewFormData);

  const steps = [
    {
      label: d.insuredDetails,
      href: "/claims/public-liability/insured-details",
      success: insuredDetailsSuccess,
    },
    {
      label: d.detailsOfLoss,
      href: "/claims/public-liability/details-of-loss",
      success: detailsOfLossSuccess,
    },
    {
      label: d.particularsOfClaimant,
      href: "/claims/public-liability/particulars-of-claimant",
      success: particularsOfClaimantSuccess,
    },
    {
      label: d.review,
      href: "/claims/public-liability/review",
      success: reviewSuccess,
    },
  ];

  const activeStep = steps.findIndex((step) => step.href === currentPath);

  const handleStepClick = (href: string) => {
    navigate(href);
  };

  return (
    <MuiStepper
      activeStep={activeStep}
      alternativeLabel
      sx={{ mb: 4 }}
      nonLinear
    >
      {steps.map((step, index) => (
        <Step key={step.label} completed={step.success}>
          <StepButton onClick={() => handleStepClick(step.href)}>
            <Typography variant="caption">{step.label}</Typography>
          </StepButton>
        </Step>
      ))}
    </MuiStepper>
  );
};

export { Stepper }; ..then we have components/summary-dialog: // SummaryDialog.tsx - FINAL VERSION

import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useStore as useInsuredDetailsStore } from "../../insured-details/hooks/useStore";
import { useStore as useDetailsOfLossStore } from "../../details-of-loss/hooks/useStore";
import { useStore as useParticularsOfClaimantStore } from "../../particulars-of-claimant/hooks/useStore";
import { useStore as useReviewStore } from "../../review/hooks/useStore";
import { useCreate } from "../hooks/useMutations";
import { useStore } from "../hooks/useStore";
import { schema } from "../types/schema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { showSnack } from "@/utils/showSnack";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { useMemo } from "react";
import { d } from "@/utils/publicLiabilityDictionary/dictionary";
import { Form } from "@/features/form/components/form";

// Import the individual page components (not the providers)
import { InsuredDetails } from "../../insured-details/page";
import { DetailsOfLoss } from "../../details-of-loss/page";
import { ParticularsOfClaimant } from "../../particulars-of-claimant/page";
import { Review } from "../../review/page";

const SummaryDialog = () => {
  const { summaryDialogOpen, updateSummaryDialogOpen } = useStore();
  const createMutation = useCreate();

  const { formData: insuredDetailsFormData } = useInsuredDetailsStore();
  const { formData: detailsOfLossFormData, fileObjects: detailsOfLossFiles = {} } = useDetailsOfLossStore();
  const { formData: particularsOfClaimantFormData, fileObjects: particularsOfClaimantFiles = {} } = useParticularsOfClaimantStore();
  const { formData: reviewFormData } = useReviewStore();

  const combinedData = useMemo(() => {
    const allFormData = {
      ...insuredDetailsFormData,
      ...detailsOfLossFormData,
      ...particularsOfClaimantFormData,
      ...reviewFormData,
    };

    const allFileObjects = {
      ...detailsOfLossFiles,
      ...particularsOfClaimantFiles,
    };

    const finalData = { ...allFormData, ...allFileObjects };

    Object.keys(finalData).forEach((key) => {
      const k = key as keyof typeof finalData;
      if (finalData[k] == null) {
        delete finalData[k];
      }
    });
    

    return finalData;
  }, [
    insuredDetailsFormData,
    detailsOfLossFormData,
    particularsOfClaimantFormData,
    reviewFormData,
    detailsOfLossFiles,
    particularsOfClaimantFiles,
  ]);

  const handleClose = () => {
    if (!createMutation.isPending) {
      updateSummaryDialogOpen(false);
    }
  };

  const handleSubmit = () => {
    try {
      const validatedData = schema.parse(combinedData);

      console.log("Submitting data:", validatedData);

      createMutation.mutate(undefined, {
        onSuccess: () => {
          showSnack("Form submitted successfully");
          handleClose();
        },
        onError: (error) => {
          console.error("Submission error:", error);
          showSnack(getErrorMessage(error), { variant: "error" });
        },
      });
    } catch (error) {
      console.error("Validation error:", error);

      if (error instanceof Error && "issues" in error) {
        const zodError = error as any;
        const errorMessages = zodError.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        showSnack(`Validation errors: ${errorMessages}`, { variant: "error" });
      } else {
        showSnack(getErrorMessage(error), { variant: "error" });
      }
    }
  };

  return (
    <Dialog open={summaryDialogOpen} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle variant="h5">{d.confirmInformation}</DialogTitle>
      <DialogContent>
        <Form
          schema={schema}
          defaultValues={combinedData}
          onSubmit={() => {}}
          readOnly={true}
        >
          <InsuredDetails />
          <Divider sx={{ my: 2 }} />
          <DetailsOfLoss readOnly />
          <Divider sx={{ my: 2 }} />
          <ParticularsOfClaimant />
          <Divider sx={{ my: 2 }} />
          <Review />
        </Form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {d.close}
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          loading={createMutation.isPending}
          variant="contained"
          startIcon={<SendOutlinedIcon />}
        >
          {d.submit}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export { SummaryDialog };
...then we have the next folder in the wrapper as hooks and the hooks/yseStore: import { create } from "zustand";

type Store = {
  summaryDialogOpen: boolean;
  updateSummaryDialogOpen: (open: boolean) => void;
};

export const useStore = create<Store>((set) => ({
  summaryDialogOpen: false,
  updateSummaryDialogOpen: (open) => set({ summaryDialogOpen: open }),
})); ....then hooks/useMutation: // useMutations.ts - FIXED VERSION
import { useStore as useInsuredDetailsStore } from "../../insured-details/hooks/useStore";
import { useStore as useDetailsOfLossStore } from "../../details-of-loss/hooks/useStore";
import { useStore as useParticularsOfClaimantStore } from "../../particulars-of-claimant/hooks/useStore";
import { useStore as useReviewStore } from "../../review/hooks/useStore";
import { create } from "../utils/api";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { showSnack } from "@/utils/showSnack";
import { schema } from "../types/schema";

export const useCreate = () => {
  const { formData: insuredDetailsFormData} = useInsuredDetailsStore();
  const { formData: detailsOfLossFormData, fileObjects: detailsOfLossFiles = {} } = useDetailsOfLossStore();
  const { formData: particularsOfClaimantFormData, fileObjects: particularsOfClaimantFiles = {} } = useParticularsOfClaimantStore();
  const { formData: reviewFormData} = useReviewStore();

  return useMutation({
    mutationFn: () => {
      // Combine all form data
      const combinedFormData = {
        ...insuredDetailsFormData,
        ...detailsOfLossFormData,
        ...particularsOfClaimantFormData,
        ...reviewFormData,
      };

      // Combine all file objects
      const combinedFileObjects = {
   
        ...detailsOfLossFiles,
        ...particularsOfClaimantFiles,
    
      };

      // Merge everything together
      const finalData = { ...combinedFormData, ...combinedFileObjects };

      // Clean up undefined/null values
      Object.keys(finalData).forEach((key) => {
        const k = key as keyof typeof finalData;
        if (finalData[k] == null) {
          delete finalData[k];
        }
      });

      // Validate before sending
      try {
        schema.parse(finalData);
      } catch (error) {
        console.error('Pre-submission validation failed:', error);
        throw error;
      }

      console.log('Sending data to API:', finalData);
      return create(finalData);
    },
    onSuccess: (data) => {
      console.log('Form submitted successfully:', data);
      showSnack("Form submitted successfully");
    },
    onError: (err) => {
      console.error('Submission error:', err);
      showSnack(getErrorMessage(err), { variant: "error" });
    },
  });
};...then types in the wrapper has Schema:// useMutations.ts - FIXED VERSION
import { useStore as useInsuredDetailsStore } from "../../insured-details/hooks/useStore";
import { useStore as useDetailsOfLossStore } from "../../details-of-loss/hooks/useStore";
import { useStore as useParticularsOfClaimantStore } from "../../particulars-of-claimant/hooks/useStore";
import { useStore as useReviewStore } from "../../review/hooks/useStore";
import { create } from "../utils/api";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { showSnack } from "@/utils/showSnack";
import { schema } from "../types/schema";

export const useCreate = () => {
  const { formData: insuredDetailsFormData} = useInsuredDetailsStore();
  const { formData: detailsOfLossFormData, fileObjects: detailsOfLossFiles = {} } = useDetailsOfLossStore();
  const { formData: particularsOfClaimantFormData, fileObjects: particularsOfClaimantFiles = {} } = useParticularsOfClaimantStore();
  const { formData: reviewFormData} = useReviewStore();

  return useMutation({
    mutationFn: () => {
      // Combine all form data
      const combinedFormData = {
        ...insuredDetailsFormData,
        ...detailsOfLossFormData,
        ...particularsOfClaimantFormData,
        ...reviewFormData,
      };

      // Combine all file objects
      const combinedFileObjects = {
   
        ...detailsOfLossFiles,
        ...particularsOfClaimantFiles,
    
      };

      // Merge everything together
      const finalData = { ...combinedFormData, ...combinedFileObjects };

      // Clean up undefined/null values
      Object.keys(finalData).forEach((key) => {
        const k = key as keyof typeof finalData;
        if (finalData[k] == null) {
          delete finalData[k];
        }
      });

      // Validate before sending
      try {
        schema.parse(finalData);
      } catch (error) {
        console.error('Pre-submission validation failed:', error);
        throw error;
      }

      console.log('Sending data to API:', finalData);
      return create(finalData);
    },
    onSuccess: (data) => {
      console.log('Form submitted successfully:', data);
      showSnack("Form submitted successfully");
    },
    onError: (err) => {
      console.error('Submission error:', err);
      showSnack(getErrorMessage(err), { variant: "error" });
    },
  });
};... then we have utils/api still under the wrapper for public-liability: import axios from "axios";

export const create = async (formData: any) => {
  // Step 1: Get CSRF token
  const csrfRes = await axios.get("http://localhost:3001/csrf-token", {
    withCredentials: true, // Important: include cookies
  });

  const csrfToken = csrfRes.data.csrfToken;

  // Step 2: Build FormData
  const form = new FormData();

  for (const key in formData) {
    const value = formData[key];

    if (value instanceof File) {
      form.append(key, value, value.name);
    } else {
      form.append(key, JSON.stringify(value));
    }
  }

  // Step 3: POST with token
  const response = await axios.post(
    "http://localhost:3001/submit-public-liability-form",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-csrf-token": csrfToken,  // 👈 required
      },
      withCredentials: true, // 👈 also required for cookie auth
    }
  );

  return response.data;
};
...and then the wrapper page.tsx: import axios from "axios";

export const create = async (formData: any) => {
  // Step 1: Get CSRF token
  const csrfRes = await axios.get("http://localhost:3001/csrf-token", {
    withCredentials: true, // Important: include cookies
  });

  const csrfToken = csrfRes.data.csrfToken;

  // Step 2: Build FormData
  const form = new FormData();

  for (const key in formData) {
    const value = formData[key];

    if (value instanceof File) {
      form.append(key, value, value.name);
    } else {
      form.append(key, JSON.stringify(value));
    }
  }

  // Step 3: POST with token
  const response = await axios.post(
    "http://localhost:3001/submit-public-liability-form",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-csrf-token": csrfToken,  // 👈 required
      },
      withCredentials: true, // 👈 also required for cookie auth
    }
  );

  return response.data;
};
so outside of the public-liability folder we have utils containing localStorage.tsx:: 
// persistStore.ts - FIXED VERSION
export function persistStore<T extends object>(key: string, initialState: T): {
  getInitialState: () => T;
  persistState: (state: T) => void;
  clearState: () => void;
}{
  // Utility: check if value is a valid Date object
  function isValidDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }

  // Utility: revive date from string or other input
  function reviveDate(value: unknown): Date | null {
    if (!value) return null;
    if (isValidDate(value)) return value;
    
    const date = new Date(value as string);
    return isValidDate(date) ? date : null;
  }

  // Utility: convert string booleans back to actual booleans
  function reviveBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }

  // Define known date and boolean fields - update these based on your schemas
  const dateFields = [
    'accidentDateTime', 
    'periodOfCoverFrom', 
    'periodOfCoverTo',
    'claimWhen',
    'dateOfBirth'
  ];
  
  const booleanFields = [
    'policeNotified',
    'otherPolicies', 
    'claimNoticeReceived',
    'isClaimInWriting'
  ];

  return {
    getInitialState: () => {
      const saved = localStorage.getItem(key);
      if (!saved) return initialState;

      try {
        const parsed = JSON.parse(saved);

        // Revive date fields
        dateFields.forEach(field => {
          if (field in parsed && parsed[field]) {
            const revived = reviveDate(parsed[field]);
            if (revived) {
              parsed[field] = revived;
            } else {
              // If date revival fails, remove the field to fall back to default
              delete parsed[field];
            }
          }
        });

        // Revive boolean fields
        booleanFields.forEach(field => {
          if (field in parsed) {
            const revived = reviveBoolean(parsed[field]);
            if (revived !== null) {
              parsed[field] = revived;
            }
          }
        });

        // Return merged with initialState to avoid missing keys
        return { ...initialState, ...parsed };
      } catch (err) {
        console.warn("Failed to parse localStorage:", err);
        return initialState;
      }
    },

    persistState: (state: T) => {
      try {
        // Create a copy of state for serialization
        const stateToSerialize = { ...state };
        
        // Convert dates to ISO strings for better serialization
        dateFields.forEach(field => {
          if (field in stateToSerialize && isValidDate(stateToSerialize[field as keyof T])) {
            (stateToSerialize as any)[field] = (stateToSerialize[field as keyof T] as Date).toISOString();
          }
        });

        localStorage.setItem(key, JSON.stringify(stateToSerialize));
      } catch (err) {
        console.warn("Failed to persist state:", err);
      }
    },

    clearState: () => {
      localStorage.removeItem(key);
    },
  };
}...we also have createStore.ts:import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { StateCreator } from "zustand/vanilla";

type ConfigType = {
  name?: string;
  storage?: Storage;
  skipPersist?: boolean;
};

const createStore = <T>(
  storeCreator: StateCreator<T, [["zustand/immer", never]], []>,
  config?: ConfigType
) => {
  const { name, storage, skipPersist = false } = config || {};

  const immerStore = immer(storeCreator);

  if (skipPersist) {
    return create<T>()(immerStore);
  }

  return create<T>()(
    persist(immerStore, {
      name: name || "zustand-store",
      storage: createJSONStorage(() => storage || localStorage),
    })
  );
};

export { createStore };
...normalizeData.ts: // normalizeFormData.ts
import { z } from 'zod';

export function normalizeFormData<T>(data: any, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.warn('⚠️ Initial schema validation failed. Attempting normalization...', error);

    const normalized = { ...data };

    Object.keys(normalized).forEach((key) => {
      const value = normalized[key];

      // Normalize ISO date strings to Date objects
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          normalized[key] = date;
        }
      }

      // Normalize boolean strings
      if (value === 'true') normalized[key] = true;
      if (value === 'false') normalized[key] = false;
    });

    try {
      return schema.parse(normalized);
    } catch (finalError) {
      console.error('❌ Final schema validation failed after normalization.');

      if (finalError instanceof z.ZodError) {
        console.group('🧪 Zod Validation Issues:');
        finalError.issues.forEach((issue) => {
          console.warn(
            `❌ ${issue.path.join('.')}: ${issue.message}`,
            { code: issue.code }
          );
        });
        console.groupEnd();
      }

      // Try schema defaults fallback
      try {
        return schema.parse({});
      } catch {
        throw finalError;
      }
    }
  }
}
....useAutoSave.ts:import { useEffect } from "react";
import { useWatch, useFormContext, FieldValues, DeepPartial } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

type AutoSaveFormProps<T extends FieldValues> = {
  update: (data: DeepPartial<T>) => void; // allow partials here
  debounceDelay?: number;
};



export function useAutoSaveForm<T extends FieldValues>({
  update,
  debounceDelay = 500,
}: AutoSaveFormProps<T>) {
  const { control } = useFormContext<T>();
  const values = useWatch({ control });

  const debouncedSave = useDebouncedCallback((data: DeepPartial<T>) => {
    update(data);
  }, debounceDelay);

  useEffect(() => {
    debouncedSave(values);
  }, [values, debouncedSave]);
}
...then in components at the root of  the file, i have filtUploads.tsx:import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Box, Typography, Button, SxProps } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { forwardRef, ReactElement, Ref, useRef, useState } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export type FileUploadProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  sx?: SxProps;
  helperText?: string;
  accept?: string;
};

// Type guard for uploaded file format
function isUploadedFile(
  value: unknown
): value is { url: string; name?: string; type?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof (value as any).url === "string"
  );
}

const FileUpload = forwardRef(
  <T extends FieldValues>(
    {
      name,
      label,
      sx,
      helperText,
      accept = ".pdf,image/jpeg,image/png,image/jpg",
    }: FileUploadProps<T>,
    ref: Ref<HTMLInputElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const validateFile = (file: File | null) => {
      if (!file) return true;
      if (!ALLOWED_TYPES.includes(file.type)) {
        return "Only PDF, JPG, JPEG, or PNG files are allowed.";
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return `File size must be less than ${MAX_SIZE_MB}MB.`;
      }
      return true;
    };

    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: (value: any) => {
            // Handle validation for File objects
            if (value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value) {
              const file = value as File;
              return validateFile(file);
            }
            // Allow uploaded files (with url property) to pass validation
            if (isUploadedFile(value)) {
              return true;
            }
            // Allow null/undefined (no file selected)
            if (value == null) {
              return true;
            }
            return "Invalid file format";
          },
        }}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const handleFile = (fileList: FileList | null) => {
            if (fileList && fileList[0]) {
              onChange(fileList[0]); // Save file object
            }
          };

          const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragActive(false);
            handleFile(e.dataTransfer.files);
          };

          // Handle display logic with explicit type checking
          let fileNameOrLink: React.ReactNode = helperText || "No file selected";

          // Check if it's a File object (newly uploaded)
          if (value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value) {
            const fileObj = value as File;
            fileNameOrLink = fileObj.name;
          } 
          // Check if it's an uploaded file object (with URL)
          else if (isUploadedFile(value)) {
            fileNameOrLink = (
              <a
                href={value.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {value.name || "View File"}
              </a>
            );
          }

          return (
            <Box
              sx={{
                border: "2px dashed",
                borderColor: error ? "error.main" : dragActive ? "primary.main" : "grey.400",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
                cursor: readOnly ? "not-allowed" : "pointer",
                backgroundColor: dragActive ? "grey.100" : "inherit",
                ...sx,
              }}
              onClick={() => !readOnly && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!readOnly) setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept={accept}
                style={{ display: "none" }}
                ref={inputRef}
                onChange={(e) => handleFile(e.target.files)}
                disabled={readOnly}
              />

              <CloudUploadIcon
                color={error ? "error" : "primary"}
                sx={{ fontSize: 40, mb: 1 }}
              />

              <Typography variant="body2" sx={{ mb: 1 }}>
                {label || "Upload file (PDF, JPG, JPEG, PNG, max 5MB)"}
              </Typography>

              <Button
                variant="outlined"
                component="span"
                disabled={readOnly}
                sx={{ mb: 1 }}
              >
                Browse
              </Button>

              <Typography
                variant="caption"
                color={error ? "error" : "text.secondary"}
                display="block"
              >
                {fileNameOrLink}
              </Typography>

              {error && (
                <Typography variant="caption" color="error" display="block">
                  {error.message}
                </Typography>
              )}
            </Box>
          );
        }}
      />
    );
  }
) as <T extends FieldValues>(
  props: FileUploadProps<T> & { ref?: Ref<HTMLInputElement> }
) => ReactElement;

export { FileUpload };...datePicker:import { useController, Control, FieldValues, Path } from "react-hook-form";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Props<T extends FieldValues> {
  name: Path<T>;
  label: string;
  minDate?: Date;
  maxDate?: Date;
  control?: Control<T>;
  disabled?: boolean;
}



export const DatePicker = <T extends FieldValues>({
  name,
  label,
  minDate,
  maxDate,
  control,
}: Props<T>) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  function isValidDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        label={label}
      value={isValidDate(value) ? value : null}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!error,
            helperText: error?.message,
          },
        }}
      />
    </LocalizationProvider>
  );
};
....theres a bunch of  other field components like text-fields and others...lemme show you those components, outside the multstep forms and all, we have components/controllers, which is where the datePicker and file uploads component are, lemme give you other controllers. autoComplete: import { useFormContext } from "@/features/form/hooks/useFormContext";
import { d } from "@/utils/motorDictionary/dictionary";
import {
  AutocompleteValue,
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
  TextField as MuiTextField,
} from "@mui/material";
import { forwardRef, ReactElement, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";


type AutocompleteOption = {
  label: string;
  value: string | number;
};


type AutocompleteProps<
  T extends FieldValues,
  Multiple extends boolean = false
> = Omit<
  MuiAutocompleteProps<AutocompleteOption, Multiple, false, false>,
  "renderInput" | "onChange" | "options" | "multiple"
> & {
  name: Path<T>;
  textFieldProps?: Omit<
    React.ComponentProps<typeof MuiTextField>,
    "name" | "error" | "helperText"
  >;
  options: AutocompleteOption[] | undefined;
  multiple?: Multiple;
  onOptionSelect?: Multiple extends true
    ? (options: AutocompleteOption[]) => void
    : (option: AutocompleteOption | null) => void;
};


const Autocomplete = forwardRef(
  <T extends FieldValues, Multiple extends boolean = false>(
    {
      name,
      options,
      textFieldProps,
      onOptionSelect,
      multiple = false as Multiple,
      ...autocompleteProps
    }: AutocompleteProps<T, Multiple>,
    ref: Ref<HTMLInputElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();


    return (
      <Controller
        name={name}
        control={control}
        render={({
          field: { onChange, value, ...field },
          fieldState: { error },
        }) => {
          const getValue = (): AutocompleteValue<
            AutocompleteOption,
            Multiple,
            false,
            false
          > => {
            if (multiple) {
              return (options ?? []).filter((option) =>
                Array.isArray(value) ? value.includes(option.value) : false
              ) as AutocompleteValue<
                AutocompleteOption,
                Multiple,
                false,
                false
              >;
            }
            return ((options ?? []).find((option) => option.value === value) ||
              null) as AutocompleteValue<
              AutocompleteOption,
              Multiple,
              false,
              false
            >;
          };


          return (
            <MuiAutocomplete<AutocompleteOption, Multiple, false, false>
              {...autocompleteProps}
              {...field}
              multiple={multiple}
              options={options ?? []}
              value={getValue()}
              readOnly={readOnly}
              id={name}
              onChange={(_, newValue) => {
                if (multiple) {
                  const values = (newValue as AutocompleteOption[]).map(
                    (option) => option.value
                  );
                  onChange(values);
                  if (onOptionSelect) {
                    (onOptionSelect as (options: AutocompleteOption[]) => void)(
                      newValue as AutocompleteOption[]
                    );
                  }
                } else {
                  const singleValue = newValue as AutocompleteOption | null;
                  onChange(singleValue?.value ?? "");
                  if (onOptionSelect) {
                    (
                      onOptionSelect as (
                        option: AutocompleteOption | null
                      ) => void
                    )(singleValue);
                  }
                }
              }}
              renderInput={(params) => (
                <MuiTextField
                  {...textFieldProps}
                  {...params}
                  inputRef={ref}
                  error={!!error}
                  helperText={error?.message}
                  placeholder={!options ? d.defaultLoading : ""}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      readOnly,
                      endAdornment: readOnly
                        ? null
                        : params.InputProps.endAdornment,
                    },
                  }}
                />
              )}
            />
          );
        }}
      />
    );
  }
) as <T extends FieldValues, Multiple extends boolean = false>(
  props: AutocompleteProps<T, Multiple> & { ref?: Ref<HTMLInputElement> }
) => ReactElement;


export { Autocomplete, type AutocompleteOption };


Checkbox: import { ErrorMessage } from "@/features/form/components/error-message";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
  useTheme,
} from "@mui/material";
import { forwardRef, ReactElement, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";


type CheckboxProps<T extends FieldValues> = Omit<
  MuiCheckboxProps,
  "name" | "checked" | "defaultChecked"
> & {
  name: Path<T>;
  label?: string;
  labelPlacement?: FormControlLabelProps["labelPlacement"];
  helperText?: string;
};


const Checkbox = forwardRef(
  <T extends FieldValues>(
    {
      name,
      label,
      labelPlacement = "end",
      helperText,
      ...checkboxProps
    }: CheckboxProps<T>,
    ref: Ref<HTMLInputElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();
    const theme = useTheme();


    return (
      <Controller
        name={name}
        control={control}
        render={({
          field: { value, onChange, ...field },
          fieldState: { error },
        }) => {
          const checkbox = (
            <MuiCheckbox
              {...checkboxProps}
              {...field}
              inputRef={ref}
              checked={!!value}
              onChange={(event) => onChange(event.target.checked)}
              sx={{
                color: error ? "error.main" : undefined,
                "&.Mui-checked": {
                  color: error ? "error.main" : undefined,
                },
              }}
            />
          );


          return (
            <FormControl error={!!error}>
              {label ? (
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      color: error ? theme.palette.error.main : "inherit",
                    },
                  }}
                  disabled={readOnly}
                  control={checkbox}
                  label={label}
                  labelPlacement={labelPlacement}
                />
              ) : (
                checkbox
              )}


              {(error || helperText) && <ErrorMessage<T> name={name} />}
            </FormControl>
          );
        }}
      />
    );
  }
) as <T extends FieldValues>(
  props: CheckboxProps<T> & { ref?: Ref<HTMLInputElement> }
) => ReactElement;


export { Checkbox };


Date-time-picker: import { useFormContext } from "@/features/form/hooks/useFormContext";
import { SxProps, Theme } from "@mui/material";
import {
  DateTimePicker as MuiDateTimePicker,
  DateTimePickerProps as MuiDateTimePickerProps,
} from "@mui/x-date-pickers";
import { forwardRef, ReactElement, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";


type DateTimePickerProps<T extends FieldValues> = Omit<
  MuiDateTimePickerProps<Date>,
  "name" | "value" | "onChange"
> & {
  name: Path<T>;
};


const DateTimePicker = forwardRef(
  <T extends FieldValues>(
    { name, sx, ...dateTimePickerProps }: DateTimePickerProps<T>,
    ref: Ref<HTMLDivElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();


    const defaultSx: SxProps<Theme> = {
      width: 1,
      ...sx,
    };


    return (
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const isValidDate = (val: unknown): val is Date =>
            val instanceof Date && !isNaN(val.getTime());


          const dateValue = isValidDate(value)
            ? value
            : value
            ? new Date(value as string)
            : null;


          return (
            <MuiDateTimePicker
              {...dateTimePickerProps}
              value={dateValue}
              onChange={(newValue) => {
                const finalValue = isValidDate(newValue)
                  ? newValue.toISOString()
                  : newValue;
                onChange(finalValue);
              }}
              ref={ref}
              disableOpenPicker={readOnly}
              sx={defaultSx}
              readOnly={readOnly}
             ampm={true} // AM/PM format// 24hr format; change to true if you prefer AM/PM
              minutesStep={1} // No seconds, step by 1 minute
              slotProps={{
                ...dateTimePickerProps.slotProps,
                textField: {
                  ...dateTimePickerProps.slotProps?.textField,
                  error: !!error,
                  helperText: error?.message,
                  name,
                },
              }}
            />
          );
        }}
      />
    );
  }
) as <T extends FieldValues>(
  props: DateTimePickerProps<T>,
  ref: Ref<HTMLDivElement>
) => ReactElement;


export { DateTimePicker };



Menu: import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  Box,
  Menu as MuiMenu,
  TextField,
  Typography,
} from "@mui/material";
import MenuItem, {
  MenuItemProps as MuiMenuItemProps,
} from "@mui/material/MenuItem";
import { SxProps } from "@mui/material/styles";
import {
  bindPopover,
  usePopupState,
  bindTrigger,
} from "material-ui-popup-state/hooks";
import { forwardRef, ReactElement, ReactNode, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";


type Option = {
  value: string | number;
  label: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  isOther?: boolean;
};


type MenuProps<T extends FieldValues> = Omit<
  MuiMenuItemProps,
  "name" | "error" | "value"
> & {
  name: Path<T>;
  label?: ReactNode;
  options: Option[];
  MenuItemProps?: MuiMenuItemProps;
  className?: string;
  renderLabel?: (option: Option) => ReactNode;
  sx?: SxProps;
  onOtherSelected?: () => void;
};


const Menu = forwardRef(
  <T extends FieldValues>(
    {
      name,
      options,
      MenuItemProps,
      className,
      renderLabel,
      sx,
      label,
      onChange,
      onOtherSelected,
      ...props
    }: MenuProps<T>,
    ref: Ref<HTMLLIElement>
  ) => {
    const state = usePopupState({ variant: "popover" });
    const { control } = useFormContext<T>();


    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <MuiMenu {...bindPopover(state)}>
              {options.map((option) => (
                <MenuItem
                  key={option.value}
                  {...MenuItemProps}
                  selected={field.value === option.value}
                  disabled={option.disabled}
                  onClick={() => {
                    field.onChange(option.value);
                    if (option.isOther) {
                      onOtherSelected?.();
                    }
                    state.close();
                  }}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingX: 1,
                    ...sx,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {option.leftIcon}
                    {renderLabel ? (
                      renderLabel(option)
                    ) : (
                      <Typography
                        sx={{
                          paddingX: 1,
                          textAlign: "left",
                        }}
                      >
                        {option.label}
                      </Typography>
                    )}
                  </Box>
                  {option.rightIcon}
                </MenuItem>
              ))}
            </MuiMenu>
            <span {...bindTrigger(state)}>
              <TextField
                fullWidth
                label={label as string}
                value={
                  options.find((item) => item.value === field.value)?.label ||
                  ""
                }
                variant="outlined"
                onClick={() => state.open()}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ cursor: "pointer", ...sx }}
              />
            </span>
          </>
        )}
      />
    );
  }
) as <T extends FieldValues>(
  props: MenuProps<T> & { ref?: Ref<HTMLLIElement> }
) => ReactElement;


export { Menu };
Text-area: import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  SxProps,
  Theme,
} from "@mui/material";
import { forwardRef, ReactElement, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";


type TextAreaProps<T extends FieldValues> = Omit<
  MuiTextFieldProps,
  "name" | "error" | "helperText"
> & {
  name: Path<T>;
};


const TextArea = forwardRef(
  <T extends FieldValues>(
    { name, sx, rows = 4, ...textFieldProps }: TextAreaProps<T>,
    ref: Ref<HTMLInputElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();


    const defaultSx: SxProps<Theme> = {
      width: 1,
      ...sx,
    };


    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <MuiTextField
            {...textFieldProps}
            {...field}
            inputRef={ref}
            error={!!error}
            helperText={error?.message}
            multiline
            rows={rows}
            sx={defaultSx}
            inputProps={{
              readOnly,
              ...(readOnly && { type: undefined }),
            }}
          />
        )}
      />
    );
  }
) as <T extends FieldValues>(
  props: TextAreaProps<T> & { ref?: Ref<HTMLInputElement> }
) => ReactElement;


export { TextArea };


Text-field: import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  InputBaseComponentProps,
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  SxProps,
  Theme,
} from "@mui/material";
import { forwardRef, ReactElement, Ref } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";
import { NumericFormat, PatternFormat } from "react-number-format";


type FormatType =
  | "number"
  | "phoneNumber"
  | "currency"
  | "socialSecurity"
  | undefined;


type CustomNumberFormatProps = InputBaseComponentProps & {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
};


type TextFieldProps<T extends FieldValues = FieldValues> = Omit<
  MuiTextFieldProps,
  "name" | "error" | "helperText"
> & {
  name: Path<T>;
  format?: FormatType;
};


const createNumberFormat = (
  formatConfig: {
    format?: string;
    mask?: string;
    thousandSeparator?: boolean;
    allowEmptyFormatting?: boolean;
  } = {}
) => {
  return forwardRef<HTMLInputElement, CustomNumberFormatProps>(
    function NumberFormat(props, ref) {
      const { onChange, name, ...other } = props;


      const handleValueChange = (values: { value: string }) => {
        onChange({
          target: {
            name,
            value: values.value,
          },
        });
      };


      const Component = formatConfig.format ? PatternFormat : NumericFormat;


      return (
        <Component
          {...other}
          {...formatConfig}
          format={formatConfig.format ?? ""}
          getInputRef={ref}
          onValueChange={handleValueChange}
        />
      );
    }
  );
};


const formatComponents = {
  number: createNumberFormat({
    thousandSeparator: true,
  }),
  phoneNumber: createNumberFormat({
    format: "(###) ###-####",
    allowEmptyFormatting: true,
    mask: "_",
  }),
  socialSecurity: createNumberFormat({
    format: "### ## ####",
    allowEmptyFormatting: true,
    mask: "_",
  }),
  currency: createNumberFormat({
    thousandSeparator: true,
  }),
};


const TextField = forwardRef(
  <T extends FieldValues>(
    { name, format, sx, ...textFieldProps }: TextFieldProps<T>,
    ref: Ref<HTMLInputElement>
  ) => {
    const { control, readOnly } = useFormContext<T>();


    const getInputComponent = (format?: FormatType) => {
      return format ? formatComponents[format] : undefined;
    };


    const defaultSx: SxProps<Theme> = {
      width: 1,
      ...sx,
    };


    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <MuiTextField
            {...textFieldProps}
            {...field}
            inputRef={ref}
            error={!!error}
            helperText={error?.message}
            sx={defaultSx}
            slotProps={{
              ...textFieldProps?.slotProps,
              input: {
                ...textFieldProps?.slotProps?.input,
                inputComponent: getInputComponent(format),
                readOnly,
                ...(readOnly && { type: undefined }),
              },
            }}
          />
        )}
      />
    );
  }
) as <T extends FieldValues>(
  props: TextFieldProps<T> & { ref?: Ref<HTMLInputElement> }
) => ReactElement;


export { TextField };


components/controller/locationFields/data/countries: export type State = {
  name: string;
  cities: string[];
};


export type Country = {
  name: string;
  states: State[];
};


export const countries: Country[] = [
  {
    name: "Nigeria",
    states: [
      {
        name: "Lagos",
        cities: ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Surulere", "Yaba", "Ajah", "Apapa", "Mushin", "Oshodi"]
      },
      {
        name: "Abuja",
        cities: ["Central Business District", "Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Nyanya", "Karu", "Jabi"]
      },
      {
        name: "Rivers",
        cities: ["Port Harcourt", "Obio-Akpor", "Eleme", "Okrika", "Bonny", "Oyigbo", "Etche", "Tai", "Gokana", "Khana"]
      },
      // Add more Nigerian states and cities
    ]
  },
  {
    name: "United States",
    states: [
      {
        name: "California",
        cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno", "Long Beach"]
      },
      {
        name: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers", "White Plains"]
      },
      {
        name: "Texas",
        cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Plano"]
      },
      // Add more US states and cities
    ]
  },
  {
    name: "United Kingdom",
    states: [
      {
        name: "England",
        cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Newcastle", "Bristol", "Oxford"]
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Perth", "Stirling"]
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport", "Bangor", "St Davids", "St Asaph"]
      },
      // Add more UK regions and cities
    ]
  },
  // Add more countries as needed
];
controllers/locationFields/index: import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Autocomplete as MuiAutocomplete, TextField as MuiTextField, Grid as MuiGrid } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";
import { countries } from "./data/countries";


type LocationFieldProps<T extends FieldValues> = {
  countryFieldName: Path<T>;
  stateFieldName: Path<T>;
  cityFieldName: Path<T>;
  required?: boolean;
};


export const LocationField = <T extends FieldValues>({
  countryFieldName,
  stateFieldName,
  cityFieldName,
  required = false,
}: LocationFieldProps<T>) => {
  const { control } = useFormContext<T>();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);


  useEffect(() => {
    if (selectedCountry) {
      const countryData = countries.find((c) => c.name === selectedCountry);
      setStates(countryData?.states.map((s) => s.name) || []);
      setSelectedState(null);
      setCities([]);
    }
  }, [selectedCountry]);


  useEffect(() => {
    if (selectedState && selectedCountry) {
      const countryData = countries.find((c) => c.name === selectedCountry);
      const stateData = countryData?.states.find((s) => s.name === selectedState);
      setCities(stateData?.cities || []);
    }
  }, [selectedState, selectedCountry]);


  return (
    <MuiGrid container spacing={2}>
      <MuiGrid item xs={12}>
        <Controller
          name={countryFieldName}
          control={control}
          rules={{ required: required ? "Country is required" : false }}
          render={({ field, fieldState: { error } }) => (
            <MuiAutocomplete
              {...field}
              options={countries.map((country) => country.name)}
              freeSolo
              onChange={(_, value) => {
                field.onChange(value);
                setSelectedCountry(value as string | null);
              }}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="Country"
                  error={!!error}
                  helperText={error?.message}
                  required={required}
                />
              )}
            />
          )}
        />
      </MuiGrid>
      <MuiGrid item xs={12}>
        <Controller
          name={stateFieldName}
          control={control}
          rules={{ required: required ? "State is required" : false }}
          render={({ field, fieldState: { error } }) => (
            <MuiAutocomplete
              {...field}
              options={states}
              freeSolo
              disabled={!selectedCountry}
              onChange={(_, value) => {
                field.onChange(value);
                setSelectedState(value as string | null);
              }}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="State/Province"
                  error={!!error}
                  helperText={error?.message}
                  required={required}
                />
              )}
            />
          )}
        />
      </MuiGrid>
      <MuiGrid item xs={12}>
        <Controller
          name={cityFieldName}
          control={control}
          rules={{ required: required ? "City is required" : false }}
          render={({ field, fieldState: { error } }) => (
            <MuiAutocomplete
              {...field}
              options={cities}
              freeSolo
              disabled={!selectedState}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="City"
                  error={!!error}
                  helperText={error?.message}
                  required={required}
                />
              )}
            />
          )}
        />
      </MuiGrid>
    </MuiGrid>
  );
};
components/dialog: import { Dialog as MuiDialog, DialogContent, DialogTitle } from "@mui/material";
import { cloneElement, ReactElement, useState } from "react";


interface Props {
  title: string;
  trigger: ReactElement;
  children: React.ReactNode;
}


export const Dialog = ({ title, trigger, children }: Props) => {
  const [open, setOpen] = useState(false);


  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  return (
    <>
      {cloneElement(trigger, { onClick: handleOpen })}
      <MuiDialog open={open} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
      </MuiDialog>
    </>
  );
};
components/error-message: import { FormHelperText } from "@mui/material";


import { ErrorMessage as RHFErrorMessage } from "@hookform/error-message";
import { ArrayPath, FieldValues, Path } from "react-hook-form";


type ErrorMessageProps<T extends FieldValues> = {
  name: Path<T> | ArrayPath<T>;
};


const ErrorMessage = <T extends FieldValues>({
  name,
}: ErrorMessageProps<T>) => {
  return (
    <>
      <RHFErrorMessage name={name} as={<FormHelperText error />} />
      <RHFErrorMessage name={`${name}.root`} as={<FormHelperText error />} />
    </>
  );
};


export { ErrorMessage };


components/form-error-summary: import { d } from "@/utils/motorDictionary/dictionary";
import { formatErrors, ErrorMessage } from "@/utils/formatErrors";
import { Alert, AlertTitle, List, ListItem } from "@mui/material";
import { useFormState } from "react-hook-form";
import { humanizeFieldName } from "@/utils/humanizeFieldName";


const FormErrorSummary = () => {
  const { errors, isSubmitted } = useFormState();


  if (!isSubmitted || !errors || Object.keys(errors).length === 0) return null;


  const formattedErrors = formatErrors(errors);


  const handleErrorClick = (field: string) => {
    const cleanField = field.endsWith(".root") ? field.slice(0, -5) : field;
    const formFieldName = cleanField.replace(/\[(\d+)\]/g, ".$1");


    try {
      const elementById = document.getElementById(formFieldName);
      if (elementById) {
        elementById.scrollIntoView({ behavior: "smooth", block: "center" });
        elementById.focus();
        return;
      }
      const elementByName = document.getElementsByName(formFieldName)[0];
      if (elementByName) {
        elementByName.scrollIntoView({ behavior: "smooth", block: "center" });
        elementByName.focus();
        return;
      }
      console.warn(`No element found for field: ${formFieldName}`);
    } catch (error) {
      console.error("Error focusing field:", formFieldName, error);
    }
  };


  const getDisplayLabel = (label: string, field: string) => {
    if (label.toLowerCase() === "root") {
      const parentKey = field.split(".root")[0].split(".").pop() || field;
      return d[parentKey as keyof typeof d] || humanizeFieldName(parentKey);
    }
    return label;
  };


  const groupedErrors = formattedErrors.reduce(
    (acc: Record<string, ErrorMessage[]>, error) => {
      if (error.category) {
        if (!acc[error.category]) {
          acc[error.category] = [];
        }
        acc[error.category].push(error);
      } else {
        if (!acc["general"]) {
          acc["general"] = [];
        }
        acc["general"].push(error);
      }
      return acc;
    },
    {}
  );


  return (
    <Alert
      severity="error"
      sx={{
        mb: 2,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <AlertTitle>{d.errorValidationTitle}</AlertTitle>
      <List dense>
        {groupedErrors["general"]?.map(({ label, message, field }, index) => (
          <ListItem
            key={`general-${index}`}
            sx={{
              px: 0,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => handleErrorClick(field)}
          >
            • {getDisplayLabel(label, field)}: {message}
          </ListItem>
        ))}


        {Object.entries(groupedErrors).map(([category, errors]) => {
          if (category === "general") return null;


          return (
            <div key={category}>
              <ListItem sx={{ px: 0, fontWeight: "bold" }}>
                {category}:
              </ListItem>
              {errors.map(({ label, message, field, index }, i) => (
                <ListItem
                  key={`${category}-${index}-${i}`}
                  sx={{
                    px: 2,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => handleErrorClick(field)}
                >
                  • {index !== undefined ? `#${index + 1} - ` : ""}
                  {getDisplayLabel(label, field)}: {message}
                </ListItem>
              ))}
            </div>
          );
        })}
      </List>
    </Alert>
  );
};
export { FormErrorSummary };




components/form: import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, ButtonProps, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  UseFormProps,
} from "react-hook-form";
import { z } from "zod";


interface Props<T extends z.ZodType<any, any>> {
  children: ReactNode;
  schema: T;
  values?: z.infer<T>;
  defaultValues?: UseFormProps<z.infer<T>>["defaultValues"];
  onSubmit: SubmitHandler<z.infer<T>>;
  submitButtonText?: string;
  title?: string;
  readOnly?: boolean;
  slotProps?: {
    submitButtonProps?: Partial<ButtonProps>;
  };
}


export const Form = <T extends z.ZodType<any, any>>({
  children,
  schema,
  values,
  defaultValues,
  onSubmit,
  submitButtonText = "Submit",
  title,
  readOnly,
  slotProps,
}: Props<T>) => {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: values || defaultValues,
  });


  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
        sx={{ width: "100%" }}
      >
        <Stack spacing={4}>
          {title && (
            <Typography variant="h5" component="h1">
              {title}
            </Typography>
          )}
          {children}
          {!readOnly && (
            <Button
              type="submit"
              variant="contained"
              fullWidth
              {...slotProps?.submitButtonProps}
            >
              {submitButtonText}
            </Button>
          )}
        </Stack>
      </Box>
    </FormProvider>
  );
};


Then outside components, under the features/form which is where the components folder is, we also have layout folder. We have in there :components/dashboard-layout: import { ThemeToggle } from "@/features/layout/components/theme-toggle";
import { useStore } from "@/features/layout/hooks/useStore";
import { DRAWER_WIDTH } from "@/features/layout/utils/constants";
import { d } from "@/utils/motorDictionary/dictionary";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { Container, Paper, Stack } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Outlet } from "react-router";


const DashboardLayout = () => {
  const theme = useTheme();


  const { drawerOpen, updateDrawerOpen } = useStore();


  const handleDrawerOpen = () => {
    updateDrawerOpen(true);
  };


  const handleDrawerClose = () => {
    updateDrawerOpen(false);
  };


  return (
    <Box sx={{ display: "flex" }}>
      <MuiAppBar
        position="fixed"
        sx={{
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(drawerOpen && {
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            marginLeft: `${DRAWER_WIDTH}px`,
            transition: theme.transitions.create(["margin", "width"], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              mr: 2,
              ...(drawerOpen && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>


          <Stack
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="h6" noWrap component="div">
              {d.dashboard}
            </Typography>
            <ThemeToggle />
          </Stack>
        </Toolbar>
      </MuiAppBar>
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={drawerOpen}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: theme.spacing(0, 1),
            ...theme.mixins.toolbar,
            justifyContent: "flex-end",
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton href="/employee/personal-info">
              <ListItemIcon>
                <BadgeOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary={d.newEmployee} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          padding: theme.spacing(3),
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: `-${DRAWER_WIDTH}px`,
          ...(drawerOpen && {
            transition: theme.transitions.create("margin", {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
          }),
        }}
      >
        <Box sx={{ ...theme.mixins.toolbar }} />


        <Paper sx={{ padding: 3 }}>
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
};


export { DashboardLayout };


components/theme-toggle:import { Menu } from "@/features/form/components/controllers/menu";
import { d } from "@/utils/motorDictionary/dictionary";
import ContrastOutlinedIcon from "@mui/icons-material/ContrastOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import Typography from "@mui/material/Typography";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";


export interface Option {
  value: string | number;
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}


interface FormValues {
  selectedOption: string;
}


const menuOptions: Option[] = [
  {
    value: "system",
    label: d.system,
    leftIcon: <ContrastOutlinedIcon />,
  },
  {
    value: "light",
    label: d.light,
    leftIcon: <WbSunnyOutlinedIcon />,
  },
  {
    value: "dark",
    label: d.dark,
    leftIcon: <DarkModeOutlinedIcon />,
  },
];


const ThemeToggle = () => {
  const methods = useForm<FormValues>({
    defaultValues: {
      selectedOption: "system",
    },
  });


  return (
    <FormProvider {...methods}>
      <form>
        <Menu<FormValues>
          name="selectedOption"
          options={menuOptions}
          renderLabel={(option) => (
            <Typography sx={{ paddingX: 1 }}>{option.label}</Typography>
          )}
        />
      </form>
    </FormProvider>
  );
};


export { ThemeToggle };


Then outside of components, we have hooks/useStore: import { createStore } from "@/utils/createStore";


type State = {
  drawerOpen: boolean;
};


type Actions = {
  updateDrawerOpen: (data: State["drawerOpen"]) => void;
};


type Store = State & Actions;


const useStore = createStore<Store>(
  (set) => ({
    drawerOpen: true,
    updateDrawerOpen: (is) =>
      set((state) => {
        state.drawerOpen = is;
      }),
  }),
  {
    name: "layout",
  }
);


export { useStore };


utils/constant: const DRAWER_WIDTH = 240;


export { DRAWER_WIDTH };
Where we have features folder is where we have the ,multistepForms,and then we have components in that same level that has links: import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from "react-router";


import { forwardRef, ReactElement, Ref } from "react";


type LinkProps = Omit<ReactRouterLinkProps, "to"> & {
  href: ReactRouterLinkProps["to"];
};


const Link = forwardRef(
  ({ href, ...linkProps }: LinkProps, ref: Ref<HTMLAnchorElement>) => {
    return <ReactRouterLink ref={ref} to={href} {...linkProps} />;
  }
) as (props: LinkProps & { ref?: Ref<HTMLAnchorElement> }) => ReactElement;


export { Link };


Then we have utils still in the src root, there we have utils/calculatePastDate: const calculatePastDate = (years: number): Date => {
  const today = new Date();
  return new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate()
  );
};


export { calculatePastDate };


utils/formatError:import { d } from "@/utils/motorDictionary/dictionary";
import { FieldErrors } from "react-hook-form";
import { humanizeFieldName } from "@/utils/humanizeFieldName";


export type ErrorMessage = {
  field: string;
  label: string;
  message: string | undefined;
  category?: string;
  index?: number;
};


type ErrorValue = {
  message?: string;
  type?: string;
  ref?: unknown;
} & Record<string, unknown>;


export const formatErrors = <T extends Record<string, unknown>>(
  errors: FieldErrors<T>
): ErrorMessage[] => {
  const formattedErrors: ErrorMessage[] = [];


  const processErrors = (
    obj: FieldErrors<T> | ErrorValue | Array<ErrorValue>,
    parentField = "",
    parentLabel = ""
  ): void => {
    if (!obj || typeof obj !== "object") {
      return;
    }


    Object.entries(obj).forEach(([key, value]) => {
      if (!key || value === undefined) {
        return;
      }


      const currentField = parentField ? `${parentField}.${key}` : key;
      const isArrayField = currentField.includes("[");
      const arrayMatch = currentField.match(/\[(\d+)\]/);
      const arrayIndex = arrayMatch ? parseInt(arrayMatch[1]) : undefined;


      const categoryName = currentField.split("[")[0];
      const categoryLabel =
        d[categoryName as keyof typeof d] || humanizeFieldName(categoryName);


      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item) {
            processErrors(item, `${currentField}[${index}]`, categoryLabel);
          }
        });
      } else if (value && typeof value === "object") {
        const errorValue = value as ErrorValue;
        if (errorValue.message) {
          formattedErrors.push({
            field: currentField,
            label: d[key as keyof typeof d] || humanizeFieldName(key),
            message: errorValue.message,
            category: isArrayField ? categoryLabel : undefined,
            index: arrayIndex,
          });
        } else {
          processErrors(errorValue, currentField, parentLabel);
        }
      }
    });
  };


  try {
    processErrors(errors);
  } catch (error) {
    console.error("Error processing form errors:", error);
  }


  return formattedErrors.sort((a, b) => {
    if (a.category && b.category) {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return (a.index || 0) - (b.index || 0);
    }
    if (a.category) return 1;
    if (b.category) return -1;
    return 0;
  });
};


utils/getErrorMessage:import { humanizeFieldName } from "@/utils/humanizeFieldName";
import { ZodError } from "zod";


const getErrorMessage = (error: unknown): string => {
  let message: string;


  if (error instanceof ZodError) {
    message = error.errors
      .map((item) => `${humanizeFieldName(item.path[0])}: ${item.message}`)
      .join(", ");
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Unknown error";
  }


  return message;
};


export { getErrorMessage };


utils/humanizeFieldNames: const humanizeFieldName = (field: string | number): string => {
  const str = field.toString();


  return str
    .split(/(?=[A-Z])/)
    .join(" ")
    .replace(/^./, (item) => item.toUpperCase());
};


export { humanizeFieldName };


utils/regex:const regex = {
  socialSecurityNumber: /^(?!000|666|9\d{2})\d{3}(?!00)\d{2}(?!0000)\d{4}$/,
  link: /^(https?:\/\/)?[\w-]+(\.[\w-]+)+[/#?]?.*$/,
};


export { regex };


utils/showSnack: import { enqueueSnackbar, VariantType, OptionsObject } from "notistack";


type ShowSnackOptions = Partial<OptionsObject> & {
  variant?: VariantType;
  duration?: number;
};


const showSnack = (message: string, options: ShowSnackOptions = {}) => {
  const defaultOptions: ShowSnackOptions = {
    variant: "success",
    duration: 3000,
  };


  return enqueueSnackbar(message, {
    ...defaultOptions,
    ...options,
  });
};


export { showSnack };


utils/themes:import { Link } from "@/components/link";
import { createTheme } from "@mui/material";


const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: Link,
      },
    },
    MuiTextField: {
      defaultProps: {
        slotProps: {
          inputLabel: {
            shrink: true,
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: Link,
      },
    },
  },
});


export { theme };


utils/wait:const wait = async () =>
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (2000 - 500 + 1)) + 500)
  );


export { wait };


utils/zodConfig:import { z } from "zod";


const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};


const setupZodErrors = () => {
  z.setErrorMap((issue, ctx) => {
    let message: string;


    switch (issue.code) {
      case "invalid_type":
        if (issue.received === "undefined" || issue.received === "null") {
          message = "Required";
        } else if (issue.expected === "date") {
          message = "Please enter a valid date";
        } else {
          message = "Invalid input";
        }
        break;


      case "too_small":
        if (issue.type === "date") {
          const minDate = new Date(issue.minimum as number);
          message = `Date must be after ${formatDate(minDate)}`;
        } else if (issue.minimum === 1) {
          message = "Required";
        } else if (issue.type === "array") {
          message = "At least one item is required";
        } else {
          message = `Minimum ${issue.minimum} characters`;
        }
        break;


      case "too_big":
        if (issue.type === "date") {
          if (
            issue.maximum &&
            typeof issue.maximum === "object" &&
            (issue.maximum as Date).getTime() ===
              new Date().setHours(0, 0, 0, 0)
          ) {
            message = "Date cannot be in the future";
          } else {
            const maxDate = new Date(issue.maximum as number);
            message = `Date must be before ${formatDate(maxDate)}`;
          }
        } else if (issue.type === "string") {
          message = `Maximum ${issue.maximum} characters allowed`;
        } else {
          message = ctx.defaultError;
        }
        break;


      case "invalid_date":
        message = "Please enter a valid date";
        break;


      case "invalid_string":
        if (issue.validation === "email") {
          message = ctx.data === "" ? "Required" : "Invalid email";
        } else {
          message = "Invalid input";
        }
        break;


      default:
        message = ctx.defaultError;
    }


    return { message };
  });
};


export { setupZodErrors };


Back in src root,we have main: import { ConfirmProvider } from "@/features/confirm/components/provider";
import { RoutesWrapper } from "@/routes";
import { theme } from "@/utils/theme";
import { setupZodErrors } from "@/utils/zodConfig";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";


const queryClient = new QueryClient();
setupZodErrors();


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ConfirmProvider>
            <CssBaseline />
            <SnackbarProvider />
            <RoutesWrapper />
          </ConfirmProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);


And then the rest is just other normal files ….this is the file structure or architecture of the project:: Folder PATH listing
Volume serial number is 6868-42DF
C:.
|   .gitignore
|   CHANGELOG.md
|   eslint.config.js
|   index.html
|   package-lock.json
|   package.json
|   README.md
|   structure.txt
|   tsconfig.app.json
|   tsconfig.json
|   tsconfig.node.json
|   vite.config.ts
|                
\---src
    |   main.tsx
    |   routes.tsx
    |   vite-env.d.ts
    |   
    +---components
    |       link.tsx
    |       
    +---features
    |   +---confirm
    |   |   +---components
    |   |   |       context.ts
    |   |   |       provider.tsx
    |   |   |       
    |   |   +---hooks
    |   |   |       useContext.ts
    |   |   |       
    |   |   \---types
    |   |           options.ts
    |   |           
    |   +---form
    |   |   +---components
    |   |   |   |   dialog.tsx
    |   |   |   |   error-message.tsx
    |   |   |   |   form-error-summary.tsx
    |   |   |   |   form.tsx
    |   |   |   |   
    |   |   |   \---controllers
    |   |   |       |   autocomplete.tsx
    |   |   |       |   checkbox.tsx
    |   |   |       |   date-picker.tsx
    |   |   |       |   date-time-picker.tsx
    |   |   |       |   file-upload.tsx
    |   |   |       |   location-field.tsx
    |   |   |       |   menu.tsx
    |   |   |       |   slider.tsx
    |   |   |       |   switch.tsx
    |   |   |       |   text-area.tsx
    |   |   |       |   text-field.tsx
    |   |   |       |   
    |   |   |       \---location-field
    |   |   |           |   index.tsx
    |   |   |           |   
    |   |   |           \---data
    |   |   |                   countries.ts
    |   |   |                   
    |   |   +---hooks
    |   |   |       useFormContext.ts
    |   |   |       useFormLogger.ts
    |   |   |       
    |   |   \---types
    |   |           formContext.ts
    |   |           
    |   +---layout
    |   |   +---components
    |   |   |       dashboard-layout.tsx
    |   |   |       theme-toggle.tsx
    |   |   |       
    |   |   +---hooks
    |   |   |       useStore.ts
    |   |   |       
    |   |   \---utils
    |   |           constants.ts
    |   |           
    |   +---multistep-forms
    |   |   |   multiform-wrapper.tsx
    |   |   |   registry.ts
    |   |   |   types.ts
    |   |   |   
    |   |   \---forms
    |   |       +---claims
    |   |       |   +---all-risk
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       PropertyItems.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---burglary
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       PropertyItems.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       \---hooks
    |   |       |   |               useMutations.ts
    |   |       |   |               useStore.ts
    |   |       |   |               
    |   |       |   +---combined-gpa-employers
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       DisabilityFields.tsx
    |   |       |   |   |   |       MonthlyEarningsTable.tsx
    |   |       |   |   |   |       OtherInsurers.tsx
    |   |       |   |   |   |       Witnesses.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---statement-of-earnings
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---contractors-plant-machinery
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---employers-liability
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       DisabilityFields.tsx
    |   |       |   |   |   |       MonthlyEarningsTable.tsx
    |   |       |   |   |   |       OtherInsurers.tsx
    |   |       |   |   |   |       Witnesses.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---statement-of-earnings
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---fidelity-guarantee
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---loss-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---fire-and-special-perils
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---loss-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---goods-in-transit
    |   |       |   |   |   routes.tsx
    |   |       |   |   |   
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       GoodsEntries.tsx
    |   |       |   |   |   |       Witnesses.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---group-personal-accident
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Insurers.tsx
    |   |       |   |   |   |       Witnesses.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---money
    |   |       |   |   |   routes.tsx
    |   |       |   |   |   
    |   |       |   |   +---declaration
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---motor
    |   |       |   |   +---additional-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       references.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---history
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       educational-institutions.tsx
    |   |       |   |   |   |       previous-employers.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       apiTypes.ts
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---incident-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---otherDrivers
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       educational-institutions.tsx
    |   |       |   |   |   |       OtherDrivers.tsx
    |   |       |   |   |   |       Witness.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       apiTypes.ts
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---personal-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---skills
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       proficiency-levels.tsx
    |   |       |   |   |   |       skill-set.tsx
    |   |       |   |   |   |       skill-sets.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       apiTypes.ts
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---vehicle-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   +---witnesses
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       educational-institutions.tsx
    |   |       |   |   |   |       Witness.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   +---types
    |   |       |   |   |   |       apiTypes.ts
    |   |       |   |   |   |       schema.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---utils
    |   |       |   |   |           api.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---professional-indemnity
    |   |       |   |   +---claim-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---claimant-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---contract-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---response-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---public-liability
    |   |       |   |   |   routes.tsx
    |   |       |   |   |   
    |   |       |   |   +---details-of-loss
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---insured-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---particulars-of-claimant
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       SummaryDialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   \---rent-assurance
    |   |       |       |   routes.tsx
    |   |       |       |   
    |   |       |       +---beneficiary-details
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---claim-information
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---declaration
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---insured-details
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---review
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       \---wrapper
    |   |       |           |   page.tsx
    |   |       |           |   
    |   |       |           +---components
    |   |       |           |       stepper.tsx
    |   |       |           |       summary-dialog.tsx
    |   |       |           |       
    |   |       |           +---hooks
    |   |       |           |       useMutations.ts
    |   |       |           |       useStore.ts
    |   |       |           |       
    |   |       |           \---types
    |   |       |                   schema.ts
    |   |       |                   
    |   |       +---kyc
    |   |       |   +---agents-kyc
    |   |       |   |   +---additional-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---financial-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---hooks
    |   |       |   |   +---personal-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useQueries.ts
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---types
    |   |       |   |   +---utils
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---brokers-cdd
    |   |       |   |   +---account-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---company-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---directors-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Directors.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---corporate-cdd
    |   |       |   |   +---account-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---company-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---directors-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Directors.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---hooks
    |   |       |   |   |       useStore.ts
    |   |       |   |   |       
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---types
    |   |       |   |   |       schema.ts
    |   |       |   |   |       
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---corporate-kyc
    |   |       |   |   +---company-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---directors-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Directors.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---financial-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useMutations.ts
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       +---types
    |   |       |   |       |       schema.ts
    |   |       |   |       |       
    |   |       |   |       \---utils
    |   |       |   |               api.ts
    |   |       |   |               
    |   |       |   +---individual-cdd
    |   |       |   |   +---additional-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---financial-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---personal-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---individual-kyc
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---financial-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---personal-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---naicom-company-cdd
    |   |       |   |   +---account-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---company-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---directors-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Directors.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---hooks
    |   |       |   |   |       useStore.ts
    |   |       |   |   |       
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---types
    |   |       |   |   |       schema.ts
    |   |       |   |   |       
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   +---naicom-partners-cdd
    |   |       |   |   +---account-details
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---company-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---directors-info
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---components
    |   |       |   |   |   |       Directors.tsx
    |   |       |   |   |   |       
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---file-uploads
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   +---review
    |   |       |   |   |   |   page.tsx
    |   |       |   |   |   |   
    |   |       |   |   |   +---hooks
    |   |       |   |   |   |       useStore.ts
    |   |       |   |   |   |       
    |   |       |   |   |   \---types
    |   |       |   |   |           schema.ts
    |   |       |   |   |           
    |   |       |   |   \---wrapper
    |   |       |   |       |   page.tsx
    |   |       |   |       |   
    |   |       |   |       +---components
    |   |       |   |       |       stepper.tsx
    |   |       |   |       |       summary-dialog.tsx
    |   |       |   |       |       
    |   |       |   |       +---hooks
    |   |       |   |       |       useStore.ts
    |   |       |   |       |       
    |   |       |   |       \---types
    |   |       |   |               schema.ts
    |   |       |   |               
    |   |       |   \---partners-cdd
    |   |       |       +---account-details
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---company-info
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---directors-info
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---components
    |   |       |       |   |       Directors.tsx
    |   |       |       |   |       
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---file-uploads
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       +---review
    |   |       |       |   |   page.tsx
    |   |       |       |   |   
    |   |       |       |   +---hooks
    |   |       |       |   |       useStore.ts
    |   |       |       |   |       
    |   |       |       |   \---types
    |   |       |       |           schema.ts
    |   |       |       |           
    |   |       |       \---wrapper
    |   |       |           |   page.tsx
    |   |       |           |   
    |   |       |           +---components
    |   |       |           |       stepper.tsx
    |   |       |           |       summary-dialog.tsx
    |   |       |           |       
    |   |       |           +---hooks
    |   |       |           |       useStore.ts
    |   |       |           |       
    |   |       |           \---types
    |   |       |                   schema.ts
    |   |       |                   
    |   |       +---utils
    |   |       |       api.ts
    |   |       |       localStorage.tsx
    |   |       |       
    |   |       \---wrapper
    |   \---terms-and-conditions
    |       \---hooks
    |               useTermsAndConditions.ts
    |               
    +---routes
    |       auth.routes.tsx
    |       cdd.routes.tsx
    |       claims.routes.tsx
    |       dashboard.routes.tsx
    |       kyc.routes.tsx
    |       
    \---utils
        |   calculatePastDate.ts
        |   createStore.ts
        |   formatErrors.ts
        |   getErrorMessage.ts
        |   humanizeFieldName.ts
        |   normalizeData.tsx
        |   regex.ts
        |   showSnack.tsx
        |   theme.ts
        |   useAutoSaveForm.tsx
        |   wait.ts
        |   zodConfig.ts
        |   
        +---agentsKYCDictionary
        |       dictionary.ts
        |       
        +---brokersCDDDictionary
        |       dictionary.ts
        |       
        +---corporateCDDDictionary
        |       dictionary.ts
        |       
        +---corporateKYCDictionary
        |       dictionary.ts
        |       
        +---fidelityDictionary
        |       dictionary.ts
        |       
        +---fireDictionary
        |       dictionary.ts
        |       
        +---individualKYCDictionary
        |       dictionary.ts
        |       
        +---kycDictionary
        |       dictionary.ts
        |       
        +---moneyInsuranceDictionary
        |       dictionary.ts
        |       
        +---motorDictionary
        |       dictionary.ts
        |       
        +---professionalIndemnityDictionary
        |       dictionary.ts
        |       
        +---publicLiabilityDictionary
        |       dictionary.ts
        |       
        \---rentAssuranceDictionary
                dictionary.ts
                

…now the last thin is the rest of the forms we will be working with..so far, the forms i’ve shown arefor claims…i’ll just give the page.tsx of each section of each form now.so …all risk/insured-details:import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "../wrapper/hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { PropertyItems } from "./components/PropertyItems";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const hasHirePurchaseAgreement = useWatch({
    control,
    name: "hasHirePurchaseAgreement",
  });


  const hasRecoverySteps = useWatch({
    control,
    name: "hasRecoverySteps",
  });


  const hasOtherInsurance = useWatch({
    control,
    name: "hasOtherInsurance",
  });


  const hasPreviousClaim = useWatch({
    control,
    name: "hasPreviousClaim",
  });


  const hasPreviousBurglaryAllRiskClaim = useWatch({
    control,
    name: "hasPreviousBurglaryAllRiskClaim",
  });


  const hasInformedPolice = useWatch({
    control,
    name: "hasInformedPolice",
  });


  return (
    <>
      {/* Type of Claim Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Claim Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="typeOfClaim"
          label="Type of Claim"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="locationOfClaim"
          label="Location of Claim"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfOccurrence"
          label="Date of Occurrence"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="timeOfOccurrence"
          label="Time of Occurrence"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="propertyInvolved"
          label="Describe Property Involved (model, make, year etc)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="circumstancesOfLoss"
          label="Provide the circumstance of loss or damage"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="estimateOfLoss"
          label="Estimate of Loss/Repairs"
        />
      </Grid>


      {/* Property Items Table */}
      <Grid size={{ xs: 12 }}>
        <PropertyItems />
      </Grid>


      {/* Additional Questions */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Additional Information
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isSoleOwner"
          label="Are you the sole owner of the property destroyed, stolen or damaged?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasHirePurchaseAgreement"
          label="Are there any hire purchase agreements?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasHirePurchaseAgreement === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hireCompanyName"
              label="Hire Company Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextArea<Schema>
              name="hireCompanyAddress"
              label="Hire Company Address"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasRecoverySteps"
          label="Have you taken any steps to recover the lost property?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasRecoverySteps === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="recoveryStepsDetails"
            label="Please provide details of recovery steps taken"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasOtherInsurance"
          label="Are there any other insurance cover upon the same property?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasOtherInsurance === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="otherInsuranceDetails"
            label="Please give full details of Insurance Cover"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousLoss"
          label="Have you ever sustained loss of the same nature?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="propertyValueAtLoss"
          label="What was the total value of the property insured at the time of loss?"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasOtherInsuranceCover"
          label="At the time of the incident, was there any other insurance cover in place?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousClaim"
          label="Have you previously made a Claim with any Insurer in respect of risks covered by this policy?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousClaim === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousClaimDetails"
            label="Please provide details of previous claims"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousBurglaryLoss"
          label="Have you ever sustained a burglary loss?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousBurglaryAllRiskClaim"
          label="Have you ever made a burglary/all risk claim?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousBurglaryAllRiskClaim === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousBurglaryDetails"
            label="Please provide details of previous burglary/all risk claims"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasInformedPolice"
          label="Have you informed the police?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasInformedPolice === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="policeStationName"
              label="Police Station Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextArea<Schema>
              name="policeStationAddress"
              label="Police Station Address"
              rows={4}
            />
          </Grid>
        </>
      )}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { detailsOfLoss, updateDetailsOfLoss } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateDetailsOfLoss(data);
    navigate("/claims/all-risk/review");
  };


  return (
    <Form
      schema={schema}
      values={detailsOfLoss}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Details-of-loss: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "../wrapper/hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { PropertyItems } from "./components/PropertyItems";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const hasHirePurchaseAgreement = useWatch({
    control,
    name: "hasHirePurchaseAgreement",
  });


  const hasRecoverySteps = useWatch({
    control,
    name: "hasRecoverySteps",
  });


  const hasOtherInsurance = useWatch({
    control,
    name: "hasOtherInsurance",
  });


  const hasPreviousClaim = useWatch({
    control,
    name: "hasPreviousClaim",
  });


  const hasPreviousBurglaryAllRiskClaim = useWatch({
    control,
    name: "hasPreviousBurglaryAllRiskClaim",
  });


  const hasInformedPolice = useWatch({
    control,
    name: "hasInformedPolice",
  });


  return (
    <>
      {/* Type of Claim Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Claim Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="typeOfClaim"
          label="Type of Claim"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="locationOfClaim"
          label="Location of Claim"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfOccurrence"
          label="Date of Occurrence"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="timeOfOccurrence"
          label="Time of Occurrence"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="propertyInvolved"
          label="Describe Property Involved (model, make, year etc)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="circumstancesOfLoss"
          label="Provide the circumstance of loss or damage"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="estimateOfLoss"
          label="Estimate of Loss/Repairs"
        />
      </Grid>


      {/* Property Items Table */}
      <Grid size={{ xs: 12 }}>
        <PropertyItems />
      </Grid>


      {/* Additional Questions */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Additional Information
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isSoleOwner"
          label="Are you the sole owner of the property destroyed, stolen or damaged?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasHirePurchaseAgreement"
          label="Are there any hire purchase agreements?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasHirePurchaseAgreement === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hireCompanyName"
              label="Hire Company Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextArea<Schema>
              name="hireCompanyAddress"
              label="Hire Company Address"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasRecoverySteps"
          label="Have you taken any steps to recover the lost property?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasRecoverySteps === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="recoveryStepsDetails"
            label="Please provide details of recovery steps taken"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasOtherInsurance"
          label="Are there any other insurance cover upon the same property?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasOtherInsurance === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="otherInsuranceDetails"
            label="Please give full details of Insurance Cover"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousLoss"
          label="Have you ever sustained loss of the same nature?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="propertyValueAtLoss"
          label="What was the total value of the property insured at the time of loss?"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasOtherInsuranceCover"
          label="At the time of the incident, was there any other insurance cover in place?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousClaim"
          label="Have you previously made a Claim with any Insurer in respect of risks covered by this policy?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousClaim === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousClaimDetails"
            label="Please provide details of previous claims"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousBurglaryLoss"
          label="Have you ever sustained a burglary loss?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousBurglaryAllRiskClaim"
          label="Have you ever made a burglary/all risk claim?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousBurglaryAllRiskClaim === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousBurglaryDetails"
            label="Please provide details of previous burglary/all risk claims"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasInformedPolice"
          label="Have you informed the police?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasInformedPolice === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="policeStationName"
              label="Police Station Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextArea<Schema>
              name="policeStationAddress"
              label="Police Station Address"
              rows={4}
            />
          </Grid>
        </>
      )}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { detailsOfLoss, updateDetailsOfLoss } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateDetailsOfLoss(data);
    navigate("/claims/all-risk/review");
  };


  return (
    <Form
      schema={schema}
      values={detailsOfLoss}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Next burglary claims form : insured-details: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "../wrapper/hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";


const Page = () => {
  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label="Policy Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label="Period of Cover From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label="Period of Cover To"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Personal Information
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="nameOfInsured"
          label="Name of Insured"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="companyName"
          label="Company Name (if applicable)"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="title"
          label="Title"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label="Date of Birth"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="gender"
          label="Gender"
          options={[
            { label: "Male", value: "Male" },
            { label: "Female", value: "Female" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Contact Information
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label="Phone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label="Email"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="alertPreference"
          label="Alert Preference"
          options={[
            { label: "Email", value: "Email" },
            { label: "SMS", value: "SMS" },
            { label: "Both", value: "Both" },
          ]}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { insuredDetails, updateInsuredDetails } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateInsuredDetails(data);
    navigate("/claims/burglary/details-of-loss");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={insuredDetails}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Insured Details"
    >
      <Page />
    </Form>
  );
};


export { Provider as InsuredDetailsPage };
details-of-loss:import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "../wrapper/hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { PropertyItems } from "./components/PropertyItems";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const premisesOccupied = useWatch({
    control,
    name: "premisesOccupied",
  });


  const hasSuspects = useWatch({
    control,
    name: "hasSuspects",
  });


  const hasInformedPolice = useWatch({
    control,
    name: "hasInformedPolice",
  });


  const isSoleOwner = useWatch({
    control,
    name: "isSoleOwner",
  });


  const hasOtherInsurance = useWatch({
    control,
    name: "hasOtherInsurance",
  });


  const hasPreviousTheft = useWatch({
    control,
    name: "hasPreviousTheft",
  });


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Premises Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="premisesAddress"
          label="Full Address of Premises Involved"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="premisesTelephone"
          label="Premises Telephone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="theftDate"
          label="Date of Theft"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="theftTime"
          label="Time of Theft"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="entryDetails"
          label="Give full details of how entry to premises was effected"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="roomsEntered"
          label="Which rooms were entered?"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="premisesOccupied"
          label="Were the premises occupied at time of loss?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {premisesOccupied === "false" && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="lastOccupiedDateTime"
            label="State date and hour they were last occupied"
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasSuspects"
          label="Do your suspicions rest upon anyone?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasSuspects === "true" && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="suspectName"
            label="State name"
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasInformedPolice"
          label="Have you informed the Police?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasInformedPolice === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="policeNotificationDate"
              label="Date of Notification"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="policeStationName"
              label="Name of Police Station"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="policeStationAddress"
              label="Address of Police Station"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isSoleOwner"
          label="Are you the sole owner of the property damaged or stolen?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isSoleOwner === "false" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="otherOwnersName"
              label="Name of Other Owners"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="otherOwnersAddress"
              label="Address of Other Owners"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasOtherInsurance"
          label="Is there any other insurance cover against this loss?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasOtherInsurance === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="otherInsurersName"
              label="Name of Other Insurers"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="otherInsurersAddress"
              label="Address of Other Insurers"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="totalContentsValue"
          label="At the time of loss, what amount would you value the total contents of your premises?"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="firePolicySum"
          label="What is the sum insured under your fire policy?"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="fireInsurersName"
          label="Name of Fire Insurers"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="fireInsurersAddress"
          label="Address of Fire Insurers"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousTheft"
          label="Have you ever sustained a previous loss by burglary or theft?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousTheft === "true" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousTheftDetails"
            label="Explain the circumstances"
            rows={4}
          />
        </Grid>
      )}


      {/* Property Items Table */}
      <Grid size={{ xs: 12 }}>
        <PropertyItems />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { detailsOfLoss, updateDetailsOfLoss } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateDetailsOfLoss(data);
    navigate("/claims/burglary/review");
  };


  return (
    <Form
      schema={schema}
      values={detailsOfLoss}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Next form is contract-plant-machinery..insured details: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Menu } from "@/features/form/components/controllers/menu";


const Page = () => {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="policyNumber"
          label="Policy Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label="Period of Cover From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label="Period of Cover To"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="insuredName"
          label="Name of Insured"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="companyName"
          label="Company Name (if applicable)"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="title"
          label="Title"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label="Date of Birth"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="gender"
          label="Gender"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label="Phone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label="Email"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="alertPreference"
          label="Alert Preference"
          options={[
            { value: "email", label: "Email" },
            { value: "sms", label: "SMS" },
            { value: "both", label: "Both" },
          ]}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData, updateIsSubmitted } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/contractors-plant-machinery/details-of-loss");
  };


  const handleError = () => {
    updateIsSubmitted(true);
  };


  return (
    <Form
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onError={handleError}
      readOnly={readOnly}
      title="Insured Details"
      submitButtonText="Next"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
    >
      <Page />
    </Form>
  );
};


export { Provider as InsuredDetailsPage };
Details-of-loss: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Menu } from "@/features/form/components/controllers/menu";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";
import { TextArea } from "@/features/form/components/controllers/text-area";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const policeInformed = useWatch({
    control,
    name: "policeInformed",
  });


  const isSoleOwner = useWatch({
    control,
    name: "isSoleOwner",
  });


  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="itemNumber"
          label="Item Number (as listed in the policy schedule)"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="yearOfManufacture"
          label="Year of Manufacture"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="make"
          label="Make and Model of Plant/Machinery"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="registrationNumber"
          label="Registration/Serial Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfPurchase"
          label="Date of Purchase"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="costPrice"
          label="Original Cost Price"
          type="number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="deductionForAge"
          label="Deduction for Age, Use and/or Wear and Tear"
          type="number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="sumClaimedPresent"
          label="Sum Claimed for Present Value"
          type="number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="sumClaimedRepairs"
          label="Sum Claimed for Repairs"
          type="number"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <DateTimePicker<Schema>
          name="dateTimeOfLoss"
          label="Date and Time of Loss/Damage"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="lastSeenLocation"
          label="If NOT known, when and where was the property last seen intact?"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="lossLocation"
          label="Where did the loss/damage occur? (Please provide full address and location details)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="damagedParts"
          label="Please describe the parts damaged and extent of damage in detail"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="inspectionLocation"
          label="Where can the damaged plant/machinery be inspected? (Please provide full address)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="circumstances"
          label="Please give a FULL account of circumstances in which loss/damage was sustained"
          rows={6}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="responsibleParties"
          label="State here any suspicions or information as to the person or parties responsible for the damage"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="policeInformed"
          label="Have the Police Been Informed of this Incident?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      {policeInformed === "true" && (
        <>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="policeStation"
              label="If so, when and which Police station? (Please provide full details)"
              rows={4}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextArea<Schema>
              name="recoveryActions"
              label="Give particulars of any other action taken with the object of recovery of lost property"
              rows={4}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isSoleOwner"
          label="Are you the sole owner of the property lost or damaged?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      {isSoleOwner === "false" && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="ownershipDetails"
            label="If not, please provide full details of ownership"
            rows={4}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="otherInsurance"
          label="Give details of any other insurance covering the property against theft, loss or damage"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="thirdPartyDetails"
          label="If loss/damage involved a Third Party, state name and details of their insurance company"
          rows={4}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData, updateIsSubmitted } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/contractors-plant-machinery/review");
  };


  const handleError = () => {
    updateIsSubmitted(true);
  };


  return (
    <Form
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onError={handleError}
      readOnly={readOnly}
      title="Details of Plant/Machinery Lost or Damaged"
      submitButtonText="Next"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Next form is employee-liability:insure-dtails:import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { Schema, schema, } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";






const Page = () => {


  const { updateFormData } = useStore();


  useAutoSaveForm<Schema>({ update: updateFormData });


  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label="Policy Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label="Period of Cover From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label="Period of Cover To"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="nameOfInsured"
          label="Name of Insured"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label="Phone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label="Email"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Autocomplete<Schema>
          name="alertPreference"
          options={[
            { label: "Email", value: "Email" },
            { label: "SMS", value: "SMS" },
            { label: "Both", value: "Both" },
          ]}
          textFieldProps={{
            label: "How would you prefer to receive claim updates?"
          }}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();




  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/employers-liability/details-of-loss");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      // values={formData}
      defaultValues={formData}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Insured Details"
    >
      <Page />
    </Form>
  );
};


export { Provider as InsuredDetailsPage };
Details-of-loss:: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Schema, schema, } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography } from "@mui/material";
import { Witnesses } from "./components/Witnesses";
import { OtherInsurers } from "./components/OtherInsurers";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";


const Page = () => {


  const { updateFormData } = useStore();


  useAutoSaveForm<Schema>({ update: updateFormData });
 
  const { control } = useFormContext<Schema>();
 


  const isDirectEmployee = useWatch({
    control,
    name: "isDirectEmployee",
  });


  const hasPreviousAccidents = useWatch({
    control,
    name: "hasPreviousAccidents",
  });


  const isReceivingMedicalAttention = useWatch({
    control,
    name: "isReceivingMedicalAttention",
  });


  const isTotallyDisabled = useWatch({
    control,
    name: "isTotallyDisabled",
  });


  const canPerformDuties = useWatch({
    control,
    name: "canPerformDuties",
  });


  return (
    <>
      {/* Section 1 - Injured Party Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Injured Party Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="injuredPartyName"
          label="Name of Injured Party"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="injuredPartyAge"
          label="Age"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="injuredPartyAddress"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="averageMonthlyEarnings"
          label="Average Monthly Earnings"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="occupation"
          label="Occupation"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isDirectEmployee"
          label="Is the Injured Party in your direct employment?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isDirectEmployee === "true" && (
        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="employmentDate"
            label="Date of Employment"
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="maritalStatus"
          label="Marital Status"
          options={[
            { label: "Single", value: "single" },
            { label: "Married", value: "married" },
            { label: "Widowed", value: "widowed" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="childrenDetails"
          label="Children Details (Number and Ages)"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="hasPreviousAccidents"
          label="Has the injured party been previously involved in any accident?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {hasPreviousAccidents === "true" && (
        <Grid size={{ xs: 6 }}>
          <TextArea<Schema>
            name="previousAccidentsDetails"
            label="Please provide details of previous accidents"
            rows={4}
          />
        </Grid>
      )}


      {/* Section 2 - Injury Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Injury Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="natureOfInjuries"
          label="Please state the full nature of the injuries sustained (If incident occurred in connection with any machinery, provide details of machinery involved)"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="personInChargeName"
          label="Name of Person in Charge"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="personInChargePosition"
          label="Position of Person in Charge"
        />
      </Grid>


      {/* Section 3 - Accident Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Accident Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <DateTimePicker<Schema>
          name="accidentDate"
          label="Date and Time of Accident"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="accidentLocation"
          label="Location of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateReported"
          label="Date Reported"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="reportedBy"
          label="Reported By"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateStoppedWork"
          label="Date Stopped Work"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="workEngagedIn"
          label="Work Engaged In at Time of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="accidentDescription"
          label="Description of Accident"
          rows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="wasInjuredPartySober"
          label="Was the Injured Party sober or intoxicated?"
          options={[
            { label: "Sober", value: "sober" },
            { label: "Intoxicated", value: "intoxicated" },
          ]}
        />
      </Grid>


      {/* Section 4 & 5 - Medical Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Medical Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isReceivingMedicalAttention"
          label="Is the Injured Party receiving medical attention?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isReceivingMedicalAttention === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hospitalName"
              label="Hospital Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="hospitalAddress"
              label="Hospital Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="doctorName"
              label="Doctor's Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="doctorAddress"
              label="Doctor's Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      {/* Section 6 - Disability Details */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Disability Details
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isTotallyDisabled"
          label="Is the Injured Party totally disabled?"
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />
      </Grid>
      {isTotallyDisabled === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dateStoppedWorking"
              label="Date Stopped Working"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="expectedDisablementDuration"
              label="Expected Duration of Disablement"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Menu<Schema>
              name="canPerformDuties"
              label="Is the Injured Party able to carry out any part of their duties?"
              options={[
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ]}
            />
          </Grid>
          {canPerformDuties === "true" && (
            <Grid size={{ xs: 12 }}>
              <TextField<Schema>
                name="currentServicesWorth"
                label="What are their services presently worth?"
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Menu<Schema>
              name="hasClaimBeenMade"
              label="Has the Injured Party made any Claim on you?"
              options={[
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ]}
            />
          </Grid>
        </>
      )}


      {/* Section 7 - Witnesses */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Witnesses
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Witnesses />
      </Grid>


      {/* Section 8 - Other Insurers */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Other Insurers
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <OtherInsurers />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/employers-liability/statement-of-earnings");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      // values={formData}
      defaultValues={formData}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Statement-of-earnings: import { Form } from "@/features/form/components/form";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


import { Typography } from "@mui/material";
import { MonthlyEarningsTable } from "../details-of-loss/components/MonthlyEarningsTable";
import { useAutoSaveForm } from "@/utils/useAutoSaveForm";


const Page = () => {
  const { updateFormData } = useStore();


  useAutoSaveForm<Schema>({ update: updateFormData });
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Statement of Earnings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          THE WORKMAN'S COMPENSATION ORDINANCE PROVIDES FOR COMPENSATION BASED ON THE
          WORKMAN'S AVERAGE MONTHLY EARNING DURING THE PAST 12 MONTHS OR SUCH SHORT PERIOD
          AS HE MAY HAVE BEEN IN THE EMPLOYER'S SERVICE.
        </Typography>
      </Grid>
      <MonthlyEarningsTable />
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/employers-liability/review");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      // values={formData}
      defaultValues={formData}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Statement of Earnings"
    >
      <Page />
    </Form>
  );
};


export { Provider as StatementOfEarningsPage };
The next form is fidelity-guarantee…insured-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/fidelityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";


const Page = () => {
  const alertPreferenceOptions = [
    { value: "Email", label: "Email" },
    { value: "SMS", label: "SMS" },
    { value: "Both", label: "Both" },
  ];


  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="policyNumber"
            label={d.policyNumber}


          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker<Schema>
            name="periodOfCoverFrom"
            label={d.periodOfCoverFrom}


          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker<Schema>
            name="periodOfCoverTo"
            label={d.periodOfCoverTo}


          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="companyName"
            label={d.companyName}


          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="address"
            label={d.address}
            multiline
            rows={3}


          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="phone"
            label={d.phone}


          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="email"
            label={d.email}
            type="email"


          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Menu<Schema>
            name="alertPreference"
            label={d.alertPreference}
            options={alertPreferenceOptions}


          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = () => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/fidelity-guarantee/loss-details");
  };


  return (
    <Form
      submitButtonText={d.nextStep}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    >
      <Page />
    </Form>
  );
};


export { Provider as FidelityGuaranteeInsuredDetails, Page };
Loss-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/fidelityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  usePreviousIrregularity,
  useDefaulterProperty,
  useOutstandingRemuneration,
  useAdditionalSecurity,
  useDischarged,
  useSettlementProposal,
} from "./hooks/useQueries";


const Page = () => {
  const previousIrregularityQuery = usePreviousIrregularity();
  const defaulterPropertyQuery = useDefaulterProperty();
  const outstandingRemunerationQuery = useOutstandingRemuneration();
  const additionalSecurityQuery = useAdditionalSecurity();
  const dischargedQuery = useDischarged();
  const settlementProposalQuery = useSettlementProposal();


  const { control, setValue } = useFormContext<Schema>();
  const previousIrregularity = useWatch({ control, name: "previousIrregularity" });
  const discharged = useWatch({ control, name: "discharged" });


  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="defaulterName"
            label={d.defaulterName}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField<Schema>
            name="defaulterAge"
            label={d.defaulterAge}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="defaulterAddress"
            label={d.defaulterAddress}
            multiline
            rows={3}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="defaulterOccupation"
            label={d.defaulterOccupation}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker<Schema>
            name="discoveryDate"
            label={d.discoveryDate}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="defaultDuration"
            label={d.defaultDuration}
            multiline
            rows={3}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="defaultAmount"
            label={d.defaultAmount}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="previousIrregularity"
            options={previousIrregularityQuery.data}
            loading={previousIrregularityQuery.isLoading}
            textFieldProps={{ label: d.previousIrregularity }}
            onOptionSelect={(option) => {
              setValue("previousIrregularity", option?.value === "yes");
            }}
          />
        </Grid>
        {previousIrregularity === true && (
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="previousIrregularityDetails"
              label={d.previousIrregularityDetails}
              multiline
              rows={3}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker<Schema>
            name="lastCheckDate"
            label={d.lastCheckDate}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="defaulterProperty"
            options={defaulterPropertyQuery.data}
            loading={defaulterPropertyQuery.isLoading}
            textFieldProps={{ label: d.defaulterProperty }}
            onOptionSelect={(option) => {
              setValue("defaulterProperty", option?.value === "yes");
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="outstandingRemuneration"
            options={outstandingRemunerationQuery.data}
            loading={outstandingRemunerationQuery.isLoading}
            textFieldProps={{ label: d.outstandingRemuneration }}
            onOptionSelect={(option) => {
              setValue("outstandingRemuneration", option?.value === "yes");
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="additionalSecurity"
            options={additionalSecurityQuery.data}
            loading={additionalSecurityQuery.isLoading}
            textFieldProps={{ label: d.additionalSecurity }}
            onOptionSelect={(option) => {
              setValue("additionalSecurity", option?.value === "yes");
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="discharged"
            options={dischargedQuery.data}
            loading={dischargedQuery.isLoading}
            textFieldProps={{ label: d.discharged }}
            onOptionSelect={(option) => {
              setValue("discharged", option?.value === "yes");
            }}
          />
        </Grid>
        {discharged === true && (
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dischargeDate"
              label={d.dischargeDate}
            />
          </Grid>
        )}
        <Grid size={{ xs: 6 }}>
          <Autocomplete<Schema>
            name="settlementProposal"
            options={settlementProposalQuery.data}
            loading={settlementProposalQuery.isLoading}
            textFieldProps={{ label: d.settlementProposal }}
            onOptionSelect={(option) => {
              setValue("settlementProposal", option?.value === "yes");
            }}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = () => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/fidelity-guarantee/review");
  };


  return (
    <Form
      submitButtonText={d.nextStep}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    >
      <Page />
    </Form>
  );
};


export { Provider as FidelityGuaranteeLossDetails, Page };
Next is firea and special perils, insured-detais: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/fireDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";


const Page = () => {
  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];


  const alertPreferenceOptions = [
    { value: "Email", label: "Email" },
    { value: "SMS", label: "SMS" },
    { value: "Both", label: "Both" },
  ];


  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="policyNumber" label={d.policyNumber} />
      </Grid>
      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema> name="periodOfCoverFrom" label={d.periodOfCoverFrom} />
      </Grid>
      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema> name="periodOfCoverTo" label={d.periodOfCoverTo} />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="insuredName" label={d.insuredName} />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="companyName" label={d.companyName} />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema> name="title" label={d.title} />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label={d.dateOfBirth}
          maxDate={calculatePastDate(18)}
          minDate={calculatePastDate(100)}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="gender"
          label={d.gender}
          options={genderOptions}
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema> name="address" label={d.address} multiline maxRows={3} />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label={d.phone}
          format="phoneNumber"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="email" label={d.email} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="alertPreference"
          label={d.alertPreference}
          options={alertPreferenceOptions}
          sx={{ width: "100%" }}
        />
      </Grid>
    </>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/fire-and-special-perils/loss-details");
  };


  return (
    <Form
      submitButtonText={d.nextStep}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Insured Details"
    >
      <Page />
    </Form>
  );
};


export { Provider as FireAndSpecialPerilsInsuredDetails };
Loss-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/fireDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import {
  useRiskElement,
  useSoleOwner,
  useOtherInsurance,
  usePreviousClaims,
  usePremisesPurpose
} from "./hooks/useQueries";


const Page = () => {
  const riskElementQuery = useRiskElement();
  const soleOwnerQuery = useSoleOwner();
  const otherInsuranceQuery = useOtherInsurance();
  const previousClaimsQuery = usePreviousClaims();
  const premisesPurposeQuery = usePremisesPurpose();


  const { control, setValue } = useFormContext<Schema>();
  const riskElementValue = useWatch({ control, name: "riskElementIntroduced" });
  const soleOwnerValue = useWatch({ control, name: "soleOwner" });
  const otherInsuranceValue = useWatch({ control, name: "otherInsuranceCover" });
  const previousClaimsValue = useWatch({ control, name: "previousClaims" });


  return (
    <>
      <Grid size={{ xs: 8 }}>
        <TextField<Schema> name="premisesAddress" label={d.premisesAddress} multiline maxRows={3} />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="premisesTelephone"
          label={d.premisesTelephone}
          format="phoneNumber"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema> name="occurrenceDate" label={d.occurrenceDate} />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="occurrenceTime" label={d.occurrenceTime} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="damageDescription"
          label={d.damageDescription}
          multiline
          maxRows={5}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="premisesPurposePolicy"
          options={premisesPurposeQuery.data}
          loading={premisesPurposeQuery.isLoading}
          textFieldProps={{ label: d.premisesPurposePolicy }}
          onOptionSelect={(option) => {
            setValue("premisesPurposePolicy", option?.value === "yes");
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="premisesPurposeAtTime"
          label={d.premisesPurposeAtTime}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="riskElementIntroduced"
          options={riskElementQuery.data}
          loading={riskElementQuery.isLoading}
          textFieldProps={{ label: d.riskElementIntroduced }}
          onOptionSelect={(option) => {
            setValue("riskElementIntroduced", option?.value === "yes");
          }}
        />
      </Grid>
      {riskElementValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="riskElementDetails"
            label={d.riskElementDetails}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="fireDiscoveryMeasures"
          label={d.fireDiscoveryMeasures}
          multiline
          maxRows={3}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="soleOwner"
          options={soleOwnerQuery.data}
          loading={soleOwnerQuery.isLoading}
          textFieldProps={{ label: d.soleOwner }}
          onOptionSelect={(option) => {
            setValue("soleOwner", option?.value === "yes");
          }}
        />
      </Grid>
      {soleOwnerValue === false && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherOwnersDetails"
            label={d.otherOwnersDetails}
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="otherInsuranceCover"
          options={otherInsuranceQuery.data}
          loading={otherInsuranceQuery.isLoading}
          textFieldProps={{ label: d.otherInsuranceCover }}
          onOptionSelect={(option) => {
            setValue("otherInsuranceCover", option?.value === "yes");
          }}
        />
      </Grid>
      {otherInsuranceValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherInsurersDetails"
            label={d.otherInsurersDetails}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="premisesContentValue"
          label={d.premisesContentValue}
          format="currency"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="previousClaims"
          options={previousClaimsQuery.data}
          loading={previousClaimsQuery.isLoading}
          textFieldProps={{ label: d.previousClaims }}
          onOptionSelect={(option) => {
            setValue("previousClaims", option?.value === "yes");
          }}
        />
      </Grid>
      {previousClaimsValue === true && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="previousClaimsDetails"
            label={d.previousClaimsDetails}
          />
        </Grid>
      )}
    </>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/fire-and-special-perils/review");
  };


  return (
    <Form
      submitButtonText={d.nextStep}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page />
    </Form>
  );
};


export { Provider as FireAndSpecialPerilsLossDetails };
Next form is goods-in-transit…insured-details: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


const Page = () => {
  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label="Policy Number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label="Period of Cover From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label="Period of Cover To"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="companyName"
          label="Company Name"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label="Address"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label="Phone"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label="Email"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="businessType"
          label="Business Type"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="alertPreference"
          options={[
            { label: "Email", value: "Email" },
            { label: "SMS", value: "SMS" },
            { label: "Both", value: "Both" },
          ]}
          textFieldProps={{ label: "Alert Preference" }}
        />
      </Grid>
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/goods-in-transit/details-of-loss");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Insured Details"
    >
      <Page />
    </Form>
  );
};


export { Provider as InsuredDetailsPage };
…details-of-loss: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { GoodsEntries } from "./components/GoodsEntries";
import { Witnesses } from "./components/Witnesses";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Menu } from "@/features/form/components/controllers/menu";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const isVehicleInvolved: "true" | "false" = useWatch({
    control,
    name: "isVehicleInvolved",
  });


  const claimType: "owner" | "carrier" = useWatch({
    control,
    name: "claimType",
  });


  const claimMadeByOwner: "true" | "false" = useWatch({
    control,
    name: "claimMadeByOwner",
  });


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <DatePicker<Schema>
          name="dateOfLoss"
          label="Date of Loss"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="timeOfLoss"
          label="Time of Loss"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="timeOfLossPeriod"
          options={[
            { label: "AM", value: "am" },
            { label: "PM", value: "pm" },
          ]}
          textFieldProps={{ label: "Period" }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="placeOfOccurrence"
          label="Place of Occurrence"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="goodsConcerned"
          label="Description of Goods"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="numberOfPackages"
          label="Number of Packages"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="totalWeight"
          label="Total Weight"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="totalValue"
          label="Total Value"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="goodsPacking"
          label="How were the goods packed?"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="circumstancesOfLoss"
          label="Circumstances of Loss or Damage"
          multiline
          maxRows={4}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isVehicleInvolved"
          label="Was another vehicle involved?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {isVehicleInvolved === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="vehicleOwnerName"
              label="Vehicle Owner Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="vehicleOwnerAddress"
              label="Vehicle Owner Address"
              multiline
              maxRows={4}
            />
          </Grid>


          <Witnesses />


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="policeStationAddress"
              label="Police Station Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dateReportedToPolice"
              label="Date Reported to Police"
            />
          </Grid>


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="dispatchAddress"
              label="Dispatch Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dateDispatched"
              label="Date Dispatched"
            />
          </Grid>


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="consigneeName"
              label="Consignee Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="consigneeAddress"
              label="Consignee Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      <GoodsEntries />


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="damagedGoodsInspectionAddress"
          label="Address where damaged goods can be inspected"
          multiline
          maxRows={4}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Autocomplete<Schema>
          name="claimType"
          options={[
            { label: "Owner of the Goods", value: "owner" },
            { label: "Carrier of the Goods", value: "carrier" },
          ]}
          textFieldProps={{ label: "Are you claiming as the owner or carrier of the goods?" }}
        />
      </Grid>


      {claimType === "owner" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsTransportMethod"
              label="How were the goods transported?"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterName"
              label="Transporter Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterInsurersName"
              label="Transporter's Insurers Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterInsurersAddress"
              label="Transporter's Insurers Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      {claimType === "carrier" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerName"
              label="Goods Owner Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerAddress"
              label="Goods Owner Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerInsurersName"
              label="Goods Owner's Insurers Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerInsurersAddress"
              label="Goods Owner's Insurers Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="goodsConditionOnReceipt"
          label="Were the goods in sound condition when received?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="checkedByDriver"
          label="Were they checked by your driver?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="vehicleRegistrationNumber"
          label="Vehicle Registration Number"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="employeesLoadedUnloaded"
          label="Did you or your employees load or unload the vehicle?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="receiptGiven"
          label="Was a receipt given?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="carriageConditions"
          label="What conditions of carriage do you use?"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FileUpload<Schema>
          name="carriageConditionsFile"
          label="Attach specimen copy of carriage conditions"
          accept="application/pdf,image/*"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="claimMadeByOwner"
          label="Has a claim been made against you by the owner?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      {claimMadeByOwner === "true" && (
        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="dateClaimReceived"
            label="Date Claim Received"
          />
        </Grid>
      )}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/goods-in-transit/review");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Group-personal-accident..insured-details: import { Form } from "@/features/form/components/form";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { GoodsEntries } from "./components/GoodsEntries";
import { Witnesses } from "./components/Witnesses";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Menu } from "@/features/form/components/controllers/menu";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";


const Page = () => {
  const { control } = useFormContext<Schema>();


  const isVehicleInvolved: "true" | "false" = useWatch({
    control,
    name: "isVehicleInvolved",
  });


  const claimType: "owner" | "carrier" = useWatch({
    control,
    name: "claimType",
  });


  const claimMadeByOwner: "true" | "false" = useWatch({
    control,
    name: "claimMadeByOwner",
  });


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <DatePicker<Schema>
          name="dateOfLoss"
          label="Date of Loss"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="timeOfLoss"
          label="Time of Loss"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="timeOfLossPeriod"
          options={[
            { label: "AM", value: "am" },
            { label: "PM", value: "pm" },
          ]}
          textFieldProps={{ label: "Period" }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="placeOfOccurrence"
          label="Place of Occurrence"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="goodsConcerned"
          label="Description of Goods"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="numberOfPackages"
          label="Number of Packages"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="totalWeight"
          label="Total Weight"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="totalValue"
          label="Total Value"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="goodsPacking"
          label="How were the goods packed?"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="circumstancesOfLoss"
          label="Circumstances of Loss or Damage"
          multiline
          maxRows={4}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isVehicleInvolved"
          label="Was another vehicle involved?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {isVehicleInvolved === "true" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="vehicleOwnerName"
              label="Vehicle Owner Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="vehicleOwnerAddress"
              label="Vehicle Owner Address"
              multiline
              maxRows={4}
            />
          </Grid>


          <Witnesses />


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="policeStationAddress"
              label="Police Station Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dateReportedToPolice"
              label="Date Reported to Police"
            />
          </Grid>


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="dispatchAddress"
              label="Dispatch Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name="dateDispatched"
              label="Date Dispatched"
            />
          </Grid>


          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="consigneeName"
              label="Consignee Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="consigneeAddress"
              label="Consignee Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      <GoodsEntries />


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="damagedGoodsInspectionAddress"
          label="Address where damaged goods can be inspected"
          multiline
          maxRows={4}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Autocomplete<Schema>
          name="claimType"
          options={[
            { label: "Owner of the Goods", value: "owner" },
            { label: "Carrier of the Goods", value: "carrier" },
          ]}
          textFieldProps={{ label: "Are you claiming as the owner or carrier of the goods?" }}
        />
      </Grid>


      {claimType === "owner" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsTransportMethod"
              label="How were the goods transported?"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterName"
              label="Transporter Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterInsurersName"
              label="Transporter's Insurers Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="transporterInsurersAddress"
              label="Transporter's Insurers Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      {claimType === "carrier" && (
        <>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerName"
              label="Goods Owner Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerAddress"
              label="Goods Owner Address"
              multiline
              maxRows={4}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerInsurersName"
              label="Goods Owner's Insurers Name"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name="goodsOwnerInsurersAddress"
              label="Goods Owner's Insurers Address"
              multiline
              maxRows={4}
            />
          </Grid>
        </>
      )}


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="goodsConditionOnReceipt"
          label="Were the goods in sound condition when received?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="checkedByDriver"
          label="Were they checked by your driver?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="vehicleRegistrationNumber"
          label="Vehicle Registration Number"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="employeesLoadedUnloaded"
          label="Did you or your employees load or unload the vehicle?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="receiptGiven"
          label="Was a receipt given?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="carriageConditions"
          label="What conditions of carriage do you use?"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FileUpload<Schema>
          name="carriageConditionsFile"
          label="Attach specimen copy of carriage conditions"
          accept="application/pdf,image/*"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="claimMadeByOwner"
          label="Has a claim been made against you by the owner?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>
      {claimMadeByOwner === "true" && (
        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="dateClaimReceived"
            label="Date Claim Received"
          />
        </Grid>
      )}
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/goods-in-transit/review");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
Details-of-loss: import { Form } from "@/features/form/components/form";
import { DateTimePicker } from "@/features/form/components/controllers/date-time-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Schema, schema, defaultValues } from "./types/schema";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Witnesses } from "./components/Witnesses";
import { Insurers } from "./components/Insurers";
import { Menu } from "@/features/form/components/controllers/menu";
import { DatePicker } from "@/features/form/components/controllers/date-picker";


const Page = ({ readOnly }: { readOnly?: boolean }) => {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <DateTimePicker<Schema>
          name="accidentDateTime"
          label="Date and Time of Accident"
          ampm
          minutesStep={5}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="place"
          label="Place where accident occurred"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="incidentDescription"
          label="Please provide a detailed description of how the accident occurred"
          multiline
          maxRows={4}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="particularsOfInjuries"
          label="Please provide details of injuries sustained"
          multiline
          maxRows={4}
        />
      </Grid>


      <Witnesses readOnly={readOnly} />


      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="doctorName"
          label="Name of attending doctor"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="doctorAddress"
          label="Address of attending doctor"
          multiline
          maxRows={4}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Menu<Schema>
          name="isUsualDoctor"
          label="Is this your usual doctor?"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="totalIncapacitationFrom"
          label="Period of total incapacitation - From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="totalIncapacitationTo"
          label="Period of total incapacitation - To"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="partialIncapacitationFrom"
          label="Period of partial incapacitation - From"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="partialIncapacitationTo"
          label="Period of partial incapacitation - To"
        />
      </Grid>


      <Insurers readOnly={readOnly} />
    </>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/claims/group-personal-accident/review");
  };


  return (
    <Form
      submitButtonText="Save and Continue"
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Details of Loss"
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as DetailsOfLossPage };
For money claims…details-of-loss: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/moneyInsuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFieldArray, useWatch } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { Chip, IconButton, Stack, Typography } from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { Fragment } from "react";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  const { control } = useFormContext<Schema>();


  const isTransitLoss = useWatch({
    control,
    name: "isTransitLoss",
  });


  const isSafeLoss = useWatch({
    control,
    name: "isSafeLoss",
  });


  const policeNotified = useWatch({
    control,
    name: "policeNotified",
  });


  const previousLoss = useWatch({
    control,
    name: "previousLoss",
  });


  const {
    fields: transitLossDiscovererFields,
    append: appendTransitLossDiscoverer,
    remove: removeTransitLossDiscoverer,
  } = useFieldArray({
    control,
    name: "transitLossDiscoverers",
  });


  const {
    fields: keyHolderFields,
    append: appendKeyHolder,
    remove: removeKeyHolder,
  } = useFieldArray({
    control,
    name: "keyHolders",
  });


  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DatePicker<Schema>
          name="incidentDateTime"
          label={d.incidentDateTime}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="incidentLocation"
          label={d.incidentLocation}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="isTransitLoss"
          label={d.isTransitLoss}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {isTransitLoss && (
        <>
          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={12}
            id="transitLossDiscoverers"
          >
            <Typography variant="subtitle2">{d.transitLossDiscoverers}:</Typography>
            {!readOnly && (
              <IconButton
                onClick={() =>
                  appendTransitLossDiscoverer({
                    name: "",
                    position: "",
                    salary: "",
                  })
                }
                color="success"
              >
                <AddCircleRoundedIcon />
              </IconButton>
            )}
          </Grid>
          {transitLossDiscovererFields.map((field, index) => (
            <Fragment key={field.id}>
              <Grid
                sx={{ display: "flex", alignItems: "center" }}
                size={{ xs: 12 }}
              >
                <Chip
                  label={`${d.discovererName} #${index + 1}:`}
                  size="small"
                  color="secondary"
                />
                {!readOnly && (
                  <IconButton
                    color="error"
                    onClick={() => removeTransitLossDiscoverer(index)}
                  >
                    <RemoveCircleOutlineRoundedIcon />
                  </IconButton>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`transitLossDiscoverers.${index}.name`}
                  label={d.discovererName}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`transitLossDiscoverers.${index}.position`}
                  label={d.discovererPosition}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`transitLossDiscoverers.${index}.salary`}
                  label={d.discovererSalary}
                />
              </Grid>
            </Fragment>
          ))}


          <Grid size={{ xs: 12, sm: 6 }}>
            <Menu<Schema>
              name="policeEscortPresent"
              label={d.policeEscortPresent}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
          </Grid>


          {policeNotified && (
            <Grid size={{ xs: 12 }}>
              <TextArea<Schema>
                name="policeEscortDetails"
                label={d.policeEscortDetails}
              />
            </Grid>
          )}


          <Grid size={{ xs: 12, sm: 6 }}>
            <Menu<Schema>
              name="employeeIntegrityCheck"
              label={d.employeeIntegrityCheck}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
          </Grid>


          {policeNotified && (
            <Grid size={{ xs: 12 }}>
              <TextArea<Schema>
                name="employeeIntegrityDetails"
                label={d.employeeIntegrityDetails}
              />
            </Grid>
          )}
        </>
      )}


      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="isSafeLoss"
          label={d.isSafeLoss}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {isSafeLoss && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker<Schema>
              name="safeInstallationDate"
              label={d.safeInstallationDate}
            />
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="safeManufacturer"
              label={d.safeManufacturer}
            />
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="safeModel"
              label={d.safeModel}
            />
          </Grid>


          <Grid
            sx={{ display: "flex", alignItems: "center" }}
            size={12}
            id="keyHolders"
          >
            <Typography variant="subtitle2">{d.keyHolders}:</Typography>
            {!readOnly && (
              <IconButton
                onClick={() =>
                  appendKeyHolder({
                    name: "",
                    position: "",
                    salary: "",
                  })
                }
                color="success"
              >
                <AddCircleRoundedIcon />
              </IconButton>
            )}
          </Grid>
          {keyHolderFields.map((field, index) => (
            <Fragment key={field.id}>
              <Grid
                sx={{ display: "flex", alignItems: "center" }}
                size={{ xs: 12 }}
              >
                <Chip
                  label={`${d.keyHolderName} #${index + 1}:`}
                  size="small"
                  color="secondary"
                />
                {!readOnly && (
                  <IconButton
                    color="error"
                    onClick={() => removeKeyHolder(index)}
                  >
                    <RemoveCircleOutlineRoundedIcon />
                  </IconButton>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`keyHolders.${index}.name`}
                  label={d.keyHolderName}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`keyHolders.${index}.position`}
                  label={d.keyHolderPosition}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField<Schema>
                  name={`keyHolders.${index}.salary`}
                  label={d.keyHolderSalary}
                />
              </Grid>
            </Fragment>
          ))}
        </>
      )}


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="lossAmount"
          label={d.lossAmount}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="lossDescription"
          label={d.lossDescription}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="policeNotified"
          label={d.policeNotified}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {policeNotified && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="policeStation"
              label={d.policeStation}
            />
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField<Schema>
              name="policeReference"
              label={d.policeReference}
            />
          </Grid>
        </>
      )}


      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="previousLoss"
          label={d.previousLoss}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Grid>


      {previousLoss && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="previousLossDetails"
            label={d.previousLossDetails}
          />
        </Grid>
      )}
    </Grid>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.detailsOfLoss}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as MoneyInsuranceDetailsOfLoss };
export { Page as DetailsOfLoss };
export type { PageProps as DetailsOfLossProps };
declaration:import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/moneyInsuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Checkbox } from "@/features/form/components/controllers/checkbox";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Stack, Typography } from "@mui/material";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          {d.dataPrivacyNotice}
        </Typography>
        <Stack spacing={2}>
          <Typography>{d.dataUsePurpose}</Typography>
          <Typography>{d.dataSecurity}</Typography>
          <Typography>{d.dataSharing}</Typography>
        </Stack>
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Checkbox<Schema>
          name="dataPrivacyAccepted"
          label={d.dataPrivacyNotice}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          {d.declarationTitle}
        </Typography>
        <Stack spacing={2}>
          <Typography>1. {d.declarationTruthfulness}</Typography>
          <Typography>2. {d.declarationAdditionalInfo}</Typography>
          <Typography>3. {d.declarationDocuments}</Typography>
        </Stack>
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Checkbox<Schema>
          name="declarationAccepted"
          label={d.declarationTitle}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="signature"
          label="Signature"
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <DatePicker<Schema>
          name="signatureDate"
          label="Date"
        />
      </Grid>
    </Grid>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.declaration}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as MoneyInsuranceDeclaration };
export { Page as Declaration };
 
Insured-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/moneyInsuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { Menu } from "@/features/form/components/controllers/menu";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label={d.policyNumber}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="companyAddress"
          label={d.companyAddress}
          multiline
          rows={3}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="contactPerson"
          label={d.contactPerson}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="contactEmail"
          label={d.contactEmail}
          type="email"
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField<Schema>
          name="contactPhone"
          label={d.contactPhone}
        />
      </Grid>


      <Grid size={{ xs: 12, sm: 6 }}>
        <Menu<Schema>
          name="preferredContactMethod"
          label={d.preferredContactMethod}
          options={d.preferredContactMethodOptions.map((option) => ({
            value: option,
            label: option,
          }))}
        />
      </Grid>
    </Grid>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../details-of-loss");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.insuredDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as MoneyInsuranceInsuredDetails };
export { Page as InsuredDetails };
export type { PageProps as InsuredDetailsProps };
Next form is professional-indemnity..claim-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/professionalIndemnityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router-dom";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  const isClaimWritten = useWatch<Schema>({ name: "isClaimWritten" });


  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="claimNature"
            label={d.claimNature}
            multiline
            rows={3}
          />
        </Grid>


        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker<Schema>
            name="claimAwarenessDate"
            label={d.claimAwarenessDate}
          />
        </Grid>


        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker<Schema>
            name="claimIntimationDate"
            label={d.claimIntimationDate}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <Menu<Schema>
            name="isClaimWritten"
            label={d.isClaimWritten}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        </Grid>


        {!isClaimWritten && (
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name="oralClaimDetails"
              label={d.oralClaimDetails}
              multiline
              rows={3}
            />
          </Grid>
        )}


        <Grid size={{ xs: 12, md: 6 }}>
          <TextField<Schema>
            name="claimAmount"
            label={d.claimAmount}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: PageProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../response-details");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.claimDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as ProfessionalIndemnityClaimDetails, Page as ClaimDetails };
Claimant-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/professionalIndemnityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="claimantName"
          label={d.claimantName}
          multiline
          maxRows={3}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="claimantAddress"
          label={d.claimantAddress}
          multiline
          maxRows={3}
        />
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../contract-details");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.claimantDetails}
      readOnly={readOnly}
    >
      <Page />
    </Form>
  );
};


export { Provider as ProfessionalIndemnityClaimantDetails, Page as ClaimantDetails };
Contract-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/professionalIndemnityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useFormContext } from "@/features/form/hooks/useFormContext";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  const { control, setValue } = useFormContext<Schema>();


  const isContractWritten = useWatch({
    control,
    name: "isContractWritten",
  });


  return (
    <>
      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="contractPurpose"
          label={d.contractPurpose}
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="isContractWritten"
          label={d.isContractWritten}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          sx={{ width: "100%" }}
          onChange={(event) => {
            const selectedValue = (event.target as HTMLElement).textContent === "Yes";
            setValue("isContractWritten", selectedValue);
          }}
        />
      </Grid>


      {isContractWritten === true && (
        <Grid size={{ xs: 12 }}>
          <FileUpload<Schema>
            name="contractEvidenceFile"
            label="Upload contract evidence (PDF, JPG, JPEG, PNG, max 5MB)"
          />
        </Grid>
      )}


      {isContractWritten === false && (
        <Grid size={{ xs: 12 }}>
          <TextArea<Schema>
            name="contractTermsDetails"
            label={d.contractTermsDetails}
          />
        </Grid>
      )}


      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="workPerformanceDate"
          label={d.workPerformanceDate}
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="responsiblePerson"
          label={d.responsiblePerson}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextArea<Schema>
          name="responsiblePersonDetails"
          label={d.responsiblePersonDetails}
        />
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../claim-details");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.contractDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as ProfessionalIndemnityContractDetails };
export type { PageProps as ContractDetailsProps };
export { Page as ContractDetails };
Insured-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/professionalIndemnityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  const titleOptions = d.titleOptions.map((option) => ({
    label: option,
    value: option,
  }));


  const genderOptions = d.genderOptions.map((option) => ({
    label: option,
    value: option,
  }));


  const alertPreferenceOptions = d.alertPreferenceOptions.map((option) => ({
    label: option,
    value: option,
  }));


  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="policyNumber"
          label={d.policyNumber}
        />
      </Grid>


      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema>
          name="periodOfCoverFrom"
          label={d.periodOfCoverFrom}
        />
      </Grid>


      <Grid size={{ xs: 3 }}>
        <DatePicker<Schema>
          name="periodOfCoverTo"
          label={d.periodOfCoverTo}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="nameOfInsured"
          label={d.nameOfInsured}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="title"
          label={d.title}
          options={titleOptions}
          sx={{ width: "100%" }}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label={d.dateOfBirth}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="gender"
          label={d.gender}
          options={genderOptions}
          sx={{ width: "100%" }}
        />
      </Grid>


      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="alertPreference"
          label={d.alertPreference}
          options={alertPreferenceOptions}
          sx={{ width: "100%" }}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="address"
          label={d.address}
          multiline
          maxRows={3}
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phone"
          label={d.phone}
          format="phoneNumber"
        />
      </Grid>


      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="email"
          label={d.email}
          type="email"
        />
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../claimant-details");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.insuredDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as ProfessionalIndemnityInsuredDetails, Page as InsuredDetails };
Response-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/professionalIndemnityDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router-dom";
import { TextField } from "@/features/form/components/controllers/text-field";
import { Menu } from "@/features/form/components/controllers/menu";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  const hasAdditionalDetails = useWatch<Schema>({ name: "hasAdditionalDetails" });


  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="responseComments"
            label={d.responseComments}
            multiline
            rows={3}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="liabilityEstimate"
            label={d.liabilityEstimate}
            multiline
            rows={3}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <Menu<Schema>
            name="hasAdditionalDetails"
            label={d.hasAdditionalDetails}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        </Grid>


        {hasAdditionalDetails && (
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name="additionalDetails"
              label={d.additionalDetails}
              multiline
              rows={3}
            />
          </Grid>
        )}


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="lawyerDetails"
            label={d.lawyerDetails}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.responseDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as ProfessionalIndemnityResponseDetails, Page as ResponseDetails };
Rent assurance is the name  of the next form : beneficiary-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/rentAssuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryName"
            label={d.beneficiaryName}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryAge"
            label={d.beneficiaryAge}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryAddress"
            label={d.beneficiaryAddress}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryEmail"
            label={d.beneficiaryEmail}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryPhone"
            label={d.beneficiaryPhone}
            format="phoneNumber"
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryOccupation"
            label={d.beneficiaryOccupation}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../declaration");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.beneficiaryDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as RentAssuranceBeneficiaryDetails };
export { Page as BeneficiaryDetails };
export type { PageProps as BeneficiaryDetailsProps };
Claim-information: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/rentAssuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryName"
            label={d.beneficiaryName}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryAge"
            label={d.beneficiaryAge}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryAddress"
            label={d.beneficiaryAddress}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryEmail"
            label={d.beneficiaryEmail}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="beneficiaryPhone"
            label={d.beneficiaryPhone}
            format="phoneNumber"
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="beneficiaryOccupation"
            label={d.beneficiaryOccupation}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../declaration");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.beneficiaryDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as RentAssuranceBeneficiaryDetails };
export { Page as BeneficiaryDetails };
export type { PageProps as BeneficiaryDetailsProps };
Declaration: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/rentAssuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Typography, Box, Stack } from "@mui/material";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>Declaration</Typography>
        <Box sx={{ typography: 'body1', textTransform: 'uppercase' }}>
          I <TextField<Schema>
              name="declarantName"
              sx={{
                display: 'inline-flex',
                width: '200px',
                mx: 1,
                '& .MuiInputBase-root': {
                  height: '35px'
                }
              }}
            /> OF DO HEREBY WARRANT THE TRUTH OF THE ANSWERS AND PARTICULARS GIVEN ON THIS FORM, AND THAT I HAVE WITHHELD NO MATERIAL
          INFORMATION AND I HEREBY CLAIM FOR LOSS AS SET OUT IN THE SCHEDULE HERETO, AMOUNTING IN ALL TO N
          <TextField<Schema>
            name="claimAmount"
            sx={{
              display: 'inline-flex',
              width: '150px',
              mx: 1,
              '& .MuiInputBase-root': {
                height: '35px'
              }
            }}
          /> DATED THIS <DatePicker<Schema>
            name="declarationDate"
            sx={{
              display: 'inline-flex',
              width: '200px',
              mx: 1,
              '& .MuiInputBase-root': {
                height: '35px'
              }
            }}
          />
        </Box>


        <Box sx={{ typography: 'body1', mt: 4, textTransform: 'uppercase' }}>
          SIGNATURE OF INSURED: <TextField<Schema>
            name="signature"
            sx={{
              display: 'inline-flex',
              width: '200px',
              mx: 1,
              '& .MuiInputBase-root': {
                height: '35px'
              }
            }}
          />
        </Box>
      </Box>


      <Box>
        <Typography variant="h6" gutterBottom>Required Documents</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FileUpload<Schema>
              name="rentAgreementFile"
              label="Upload Rent Agreement (PDF, JPG, JPEG, PNG, max 5MB)"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FileUpload<Schema>
              name="demandNoteFile"
              label="Upload Demand Note (PDF, JPG, JPEG, PNG, max 5MB)"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FileUpload<Schema>
              name="quitNoticeFile"
              label="Upload Quit Notice (PDF, JPG, JPEG, PNG, max 5MB)"
            />
          </Grid>
        </Grid>
      </Box>


      <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
        NOTE: PLEASE ATTACH A COPY OF THE RENT AGREEMENT AND DEMAND NOTE ON RENEWAL AND/OR QUIT NOTICE TO THE COMPLETED CLAIM FORM
      </Typography>
    </Stack>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.declarationStep}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as RentAssuranceDeclaration };
export { Page as Declaration };
export type { PageProps as DeclarationProps };
Insured-details: import { Form } from "@/features/form/components/form";
import { schema, Schema, defaultValues } from "./types/schema";
import { d } from "@/utils/rentAssuranceDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useStore } from "./hooks/useStore";
import { useNavigate } from "react-router";
import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";


type PageProps = {
  readOnly?: boolean;
};


const Page = ({ readOnly }: PageProps) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="policyNumber"
            label={d.policyNumber}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="periodOfCoverFrom"
            label={d.periodOfCoverFrom}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="periodOfCoverTo"
            label={d.periodOfCoverTo}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="nameOfInsured"
            label={d.nameOfInsured}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="address"
            label={d.address}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="age"
            label={d.age}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="email"
            label={d.email}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="phone"
            label={d.phone}
            format="phoneNumber"
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="nameOfLandlord"
            label={d.nameOfLandlord}
          />
        </Grid>


        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="addressOfLandlord"
            label={d.addressOfLandlord}
          />
        </Grid>


        <Grid size={{ xs: 6 }}>
          <DatePicker<Schema>
            name="residencyDuration"
            label={d.residencyDuration}
          />
        </Grid>
      </Grid>
    </>
  );
};


const Provider = ({ readOnly }: { readOnly?: boolean }) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../claim-information");
  };


  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      values={formData}
      onSubmit={handleSubmit}
      slotProps={{
        submitButtonProps: {
          children: d.saveAndContinue,
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      title={d.insuredDetails}
      readOnly={readOnly}
    >
      <Page readOnly={readOnly} />
    </Form>
  );
};


export { Provider as RentAssuranceInsuredDetails };
export { Page as InsuredDetails };
export type { PageProps as InsuredDetailsProps };
Now, thats it for claims, all the forms so far have been claims..now we move to kyc forms..forst is Agents , personal-info:: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
// import { LocationField } from "@/features/form/components/controllers/location-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/agentsKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";


import { useState } from "react";


const Page = () => {
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState(false);
  const { control } = useFormContext<Schema>();


  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="firstName"
          label={d.firstName}
          required
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="middleName"
          label={d.middleName}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="lastName"
          label={d.lastName}
          required
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="residentialAddress"
          label={d.residentialAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Menu<Schema>
          name="gender"
          label={d.gender}
          options={d.genderOptions.map(opt => ({ value: opt.value, label: opt.label }))}
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="position"
          label={d.position}
          required
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label={d.dateOfBirth}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="placeOfBirth"
          label={d.placeOfBirth}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="sourceOfIncome"
          label={d.sourceOfIncome}
          options={[
            { value: "salaryOrBusinessIncome", label: "Salary/Business Income" },
            { value: "investmentsOrDividends", label: "Investments/Dividends" },
            { value: "Other", label: "Other", isOther: true }
          ]}
          onOtherSelected={() => setShowOtherIncomeSource(true)}
          sx={{ width: "100%" }}
        />
      </Grid>
      {showOtherIncomeSource && (
        <Grid size={{ xs: 12 }}>
          <TextField<Schema>
            name="otherIncomeSource"
            label={d.otherIncomeSource}
            required
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="nationality"
          label={d.nationality}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="phoneNumber"
          label={d.phoneNumber}
          required
          format="phoneNumber"
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="bvnNumber"
          label={d.bvnNumber}
          inputProps={{
            pattern: "[0-9]*",
            inputMode: "numeric",
            maxLength: 11,
            minLength: 11,
          }}
          required
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="taxIdNumber"
          label={d.taxIdNumber}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField<Schema>
          name="occupation"
          label={d.occupation}
          required
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="email"
          label={d.email}
          type="email"
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="idType"
          label={d.idType}
          options={[
            { value: "international passport", label: "International Passport" },
            { value: "NIMC", label: "NIMC" },
            { value: "Drivers licence", label: "Driver's License" },
            { value: "Voters Card", label: "Voter's Card" }
          ]}
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="idNumber"
          label={d.idNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="issuedDate"
          label={d.issuedDate}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="expiryDate"
          label={d.expiryDate}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="issuingBody"
          label={d.issuingBody}
          required
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();


  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/agents/additional-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.personalInfo}
    >
      <Page />
    </Form>
  );
};


export { Provider as PersonalInfo };
,,,additional-info: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/agentsKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { TextArea } from "@/features/form/components/controllers/text-area";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";


const Page = () => {
  const { control } = useFormContext();
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="agentsName"
          label={d.agentsName}
          required
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="agentsAddress"
          label={d.agentsAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="naicomNo"
          label={d.naicomNo}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="licenseIssuedDate"
          label={d.licenseIssuedDate}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="licenseExpiryDate"
          label={d.licenseExpiryDate}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="agentsEmail"
          label={d.agentsEmail}
          type="email"
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="website"
          label={d.website}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="mobileNo"
          label={d.mobileNo}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="taxIDNo"
          label={d.taxIDNo}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="arian"
          label={d.arian}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="listOfAgents"
          label={d.listOfAgents}
          multiline
          maxRows={3}
          required
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };
const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/agents/financial-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { startIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.additionalInfo}
    >
      <Page />
    </Form>
  );
};


export { Provider as AdditionalInfo };
…financial-info : import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/agentsKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Divider } from "@mui/material";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          {d.localAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localAccountNumber"
          label={d.accountNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localBankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localBankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="localAccountOpeningDate"
          label={d.accountOpeningDate}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          {d.foreignAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignAccountNumber"
          label={d.accountNumber}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignBankName"
          label={d.bankName}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignBankBranch"
          label={d.bankBranch}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="foreignAccountOpeningDate"
          label={d.accountOpeningDate}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.financialInfo}
    >
      <Page />
    </Form>
  );
};


export { Provider as FinancialInfo };
Next form is broker. company-details:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/agentsKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Divider } from "@mui/material";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          {d.localAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localAccountNumber"
          label={d.accountNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localBankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="localBankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="localAccountOpeningDate"
          label={d.accountOpeningDate}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          {d.foreignAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignAccountNumber"
          label={d.accountNumber}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignBankName"
          label={d.bankName}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="foreignBankBranch"
          label={d.bankBranch}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="foreignAccountOpeningDate"
          label={d.accountOpeningDate}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.financialInfo}
    >
      <Page />
    </Form>
  );
};


export { Provider as FinancialInfo };
Director-info: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/brokersCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { Directors } from "./components/Directors";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Directors />
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


export const BrokersCDDDirectorsInfo = ({ readOnly }: ProviderProps) => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../account-details");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.directorsInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
Account-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/brokersCDDDictionary/dictionary";
import { Grid, Typography } from "@mui/material";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Local Account Details
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="localBankName"
          label={d.localBankName}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="currentAccountNumber"
          label={d.currentAccountNumber}
          required
          type="number"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>


      <Grid item xs={12} sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Domicilliary Account Details (Optional)
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="domAccountNumber2"
          label={d.domAccountNumber2}
          type="number"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="foreignBankName2"
          label={d.foreignBankName2}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankBranchName2"
          label={d.bankBranchName2}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="currency"
          label={d.currency}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate2"
          label={d.accountOpeningDate2}
          maxDate={new Date()}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


export const BrokersCddAccountDetails = ({ readOnly }: ProviderProps) => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../file-uploads");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.accountDetails}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
File-upload: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/brokersCDDDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Box, Typography, Grid } from "@mui/material";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="incorporation"
          label={d.incorporation}
   
        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="identification"
          label={d.identification}
   
        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="identification2"
          label={d.identification2}
   
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          For NAICOM Regulated Companies
        </Typography>
        <FileUpload<Schema>
          name="NAICOMForm"
          label={d.NAICOMForm}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


export const BrokersCddFileUploads = ({ readOnly }: ProviderProps) => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      readOnly={readOnly}
      onSubmit={handleSubmit}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
Next form, corporate-cdd: , company-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  const [showOtherCompanyType, setShowOtherCompanyType] = useState(false);
  const { control } = useFormContext<Schema>();


  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="registeredCompanyAddress"
          label={d.registeredCompanyAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="incorporationNumber"
          label={d.incorporationNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="incorporationState"
          options={d.nigerianStates}
          textFieldProps={{
            label: d.incorporationState,
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfIncorporationRegistration"
          label={d.dateOfIncorporationRegistration}
          maxDate={new Date()}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="natureOfBusiness"
          label={d.natureOfBusiness}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="companyLegalForm"
          label={d.companyLegalForm}
          options={[
            { value: "soleProprietor", label: "Sole Proprietor" },
            { value: "unlimitedLiabilityCompany", label: "Unlimited Liability Company" },
            { value: "limitedLiabilityCompany", label: "Limited Liability Company" },
            { value: "publicLimitedCompany", label: "Public Limited Company" },
            { value: "jointVenture", label: "Joint Venture" },
            { value: "other", label: "Other(please specify)", isOther: true }
          ]}
          onOtherSelected={() => setShowOtherCompanyType(true)}
        />
      </Grid>
      {showOtherCompanyType && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherCompanyType"
            label={d.otherCompanyType}
            required
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="emailAddress"
          label={d.emailAddress}
          type="email"
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="website"
          label={d.website}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="taxIdentificationNumber"
          label={d.taxIdentificationNumber}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="telephoneNumber"
          label={d.telephoneNumber}
          format="phoneNumber"
          required
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate-cdd/directors-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={{ ...defaultValues, ...formData }}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.companyInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as CompanyDetails };
directors -d=info/components/directors: import { TextField } from "@/features/form/components/controllers/text-field";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { useFormContext } from "@/features/form/hooks/useFormContext";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFieldArray } from "react-hook-form";
import { Fragment } from "react/jsx-runtime";
import { Schema } from "../types/schema";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";


const Directors = () => {
  const { control, readOnly } = useFormContext<Schema>();
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState<{ [key: number]: boolean }>({});


  const { fields, append, remove } = useFieldArray({
    control,
    name: "directors",
  });


  const handleAddClick = () => {
    append({
      firstName: "",
      middleName: "",
      lastName: "",
      dob: new Date(),
      placeOfBirth: "",
      nationality: "",
      country: "",
      occupation: "",
      email: "",
      phoneNumber: "",
      BVNNumber: "",
      employersName: "",
      employersPhoneNumber: "",
      residentialAddress: "",
      taxIDNumber: "",
      idType: "",
      idNumber: "",
      issuingBody: "",
      issuedDate: new Date(),
      expiryDate: null,
      sourceOfIncome: "",
      otherSourceOfIncome: "",
    });
  };


  const handleRemoveClick = (index: number) => {
    remove(index);
  };


  return (
    <>
      <Grid sx={{ display: "flex", alignItems: "center" }} size={12} id="directors">
        <Typography variant="subtitle2">{d.directorsInfo}:</Typography>
        {!readOnly && (
          <IconButton onClick={handleAddClick} color="success">
            <AddCircleRoundedIcon />
          </IconButton>
        )}
      </Grid>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <Grid sx={{ display: "flex", alignItems: "center" }} size={{ xs: 12 }}>
            <Chip label={`${d.director} #${index + 1}`} size="small" color="secondary" />
            {!readOnly && (
              <IconButton color="error" onClick={() => handleRemoveClick(index)}>
                <RemoveCircleOutlineRoundedIcon />
              </IconButton>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.firstName`}
              label={d.firstName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.middleName`}
              label={d.middleName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.lastName`}
              label={d.lastName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name={`directors.${index}.dob`}
              label={d.dob}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.placeOfBirth`}
              label={d.placeOfBirth}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Autocomplete<Schema>
              name={`directors.${index}.nationality`}
              options={d.countries}
              textFieldProps={{
                label: d.nationality
              }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Autocomplete<Schema>
              name={`directors.${index}.country`}
              options={d.countries}
              textFieldProps={{
                label: d.country
              }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.occupation`}
              label={d.occupation}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.email`}
              label={d.email}
              type="email"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.phoneNumber`}
              label={d.phoneNumber}
              format="phoneNumber"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.BVNNumber`}
              label={d.BVNNumber}
              inputProps={{
                pattern: "[0-9]*",
                inputMode: "numeric",
                maxLength: 11,
                minLength: 11,
              }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.employersName`}
              label={d.employersName}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.employersPhoneNumber`}
              label={d.employersPhoneNumber}
              format="phoneNumber"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField<Schema>
              name={`directors.${index}.residentialAddress`}
              label={d.residentialAddress}
              multiline
              maxRows={3}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.taxIDNumber`}
              label={d.taxIDNumber}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Menu<Schema>
              name={`directors.${index}.idType`}
              label={d.idType}
              options={d.idTypeOptions}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.idNumber`}
              label={d.idNumber}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField<Schema>
              name={`directors.${index}.issuingBody`}
              label={d.issuingBody}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name={`directors.${index}.issuedDate`}
              label={d.issuedDate}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker<Schema>
              name={`directors.${index}.expiryDate`}
              label={d.expiryDate}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Menu<Schema>
              name={`directors.${index}.sourceOfIncome`}
              label={d.sourceOfIncome}
              options={d.incomeSourceOptions}
              onOtherSelected={() => {
                setShowOtherIncomeSource(prev => ({ ...prev, [index]: true }));
              }}
            />
          </Grid>
          {showOtherIncomeSource[index] && (
            <Grid size={{ xs: 6 }}>
              <TextField<Schema>
                name={`directors.${index}.otherSourceOfIncome`}
                label={d.otherSourceOfIncome}
              />
            </Grid>
          )}
        </Fragment>
      ))}
    </>
  );
};


export { Directors };
director-info/page:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { Directors } from "./components/Directors";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Directors />
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate-cdd/account-details");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={{ ...formData, directors: formData.directors ?? [] }}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.directorsInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as DirectorsInfo };
….account-details import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { Directors } from "./components/Directors";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Directors />
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate-cdd/account-details");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={{ ...formData, directors: formData.directors ?? [] }}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.directorsInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as DirectorsInfo };
File-uploads:  import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Box, Typography } from "@mui/material";


const Page = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.cacCertificate}
        </Typography>
        <FileUpload<Schema>
          name="cacCertificate"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.identification}
        </Typography>
        <FileUpload<Schema>
          name="meansOfIdentification"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate-cdd/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
          sx: { mt: 4 }
        },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FileUploads };
…next form is corporate-kyc, company-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateKYCDictionary/dictionary";
import {Grid} from "@mui/material";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { LocationField } from "@/features/form/components/controllers/location-field/index";


const Page = () => {
  const [showOtherPremiumSource, setShowOtherPremiumSource] = useState(false);
  const { control } = useFormContext<Schema>();


  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField<Schema> name="branchOffice" label="NEM Branch Office" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="insured" label="Insured" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="officeAddress" label="Office Address" required />
      </Grid>


      <Grid item xs={6}>
        <Menu<Schema>
          name="ownershipOfCompany"
          label="Ownership of Company"
          options={[
            { value: "Nigerian", label: "Nigerian" },
            { value: "Foreign", label: "Foreign" },
            { value: "Both", label: "Both" },
          ]}
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="contactPerson" label="Contact Person" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="website" label="Website" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="incorporationNumber"
          label="Incorporation Number"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="incorporationState"
          label="Incorporation State"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <DatePicker<Schema>
          name="dateOfIncorporationRegistration"
          label="Date of Incorporation/Registration"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="BVNNumber"
          label="BVN"
          type="number"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="contactPersonNo"
          label="Contact Person Mobile Number"
          type="number"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="taxIDNo"
          label="Tax Identification Number"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="emailAddress"
          label="Email Address"
          type="email"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="natureOfBusiness"
          label="Business Type/Occupation"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <Menu<Schema>
          name="estimatedTurnover"
          label="Estimated Turnover"
          options={[
            { value: "Less Than 10 Million", label: "Less Than 10 Million" },
            { value: "11 Million - 50 Million", label: "11 Million - 50 Million" },
            { value: "51 Million - 200 Million", label: "51 Million - 200 Million" },
            { value: "More than 200 Million", label: "More than 200 Million" },
          ]}
        />
      </Grid>


      <Grid item xs={6}>
        <Menu<Schema>
          name="premiumPaymentSource"
          label="Premium Payment Source"
          options={[
            { value: "Salary or Business Income", label: "Salary or Business Income" },
            { value: "Investments or Dividends", label: "Investments or Dividends" },
            { value: "Other", label: "Other(please specify)", isOther: true },
          ]}
          onOtherSelected={() => setShowOtherPremiumSource(true)}
        />
      </Grid>


      {showOtherPremiumSource && (
        <Grid item xs={6}>
          <TextField<Schema>
            name="otherPremiumPaymentSource"
            label="Specify Premium Payment Source"
            required
          />
        </Grid>
      )}
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate/directors-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.companyDetails}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as CompanyDetails };
directors/components/director: import { Chip, IconButton, Typography, Grid } from "@mui/material";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Fragment } from "react";


import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { Menu } from "@/features/form/components/controllers/menu";
import { TextField } from "@/features/form/components/controllers/text-field";
import { d } from "@/utils/brokersCDDDictionary/dictionary";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { Schema } from "../types/schema";
import { useState } from "react";
import { CountryCodes } from "validator/lib/isISO31661Alpha2";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";


export const Directors = () => {
  const { control } = useFormContext<Schema>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "directors",
  });
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState<{ [key: number]: boolean }>({});


  // Watch all sources of income at once
  const sourcesOfIncome = useWatch({
    control,
    name: "directors",
    defaultValue: []
  });


  const handleAddDirector = () => {
    append({
      title: "",
      gender: "male",
      firstName: "",
      middleName: "",
      lastName: "",
      dob: new Date(),
      placeOfBirth: "",
      nationality: "",
      residenceCountry: "",
      occupation: "",
      BVNNumber: "",
      employersName: "",
      phoneNumber: "",
      address: "",
      email: "",
      taxIDNumber: "",
      intPassNo: "",
      passIssuedCountry: "",
      idType: "International passport",
      idNumber: "",
      issuedBy: "",
      issuedDate: new Date(),
      expiryDate: new Date(),
      sourceOfIncome: "Salary Or Business Income",
      otherIncomeSource: "",
    });
  };




  const countries = Array.from(CountryCodes).map((country) => ({
    label: country,
    value: country,
  }));




  return (
    <Fragment>
      {fields.map((field, index) => {
     


        return (
          <Fragment key={field.id}>
            <Grid item xs={12}>
              <Chip
                label={`Director ${index + 1}`}
                onDelete={index > 0 ? () => remove(index) : undefined}
                deleteIcon={<RemoveCircleOutlineRoundedIcon />}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.title`}
                label={d.title}
                required
              />
            </Grid>
            {/* <Grid item xs={12} md={4}>
              <Menu<Schema>
                name={`directors.${index}.gender`}
                label={d.gender}
                options={d.genderOptions}
              />
            </Grid> */}
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.firstName`}
                label={d.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.middleName`}
                label={d.middleName}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.lastName`}
                label={d.lastName}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker<Schema>
                name={`directors.${index}.dob`}
                label={d.dob}
                maxDate={new Date()}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.placeOfBirth`}
                label={d.placeOfBirth}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
            <Autocomplete
              name={`directors.${index}.nationality`}
              options={countries}
              textFieldProps={{
                label: d.nationality
              }}
            />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.residenceCountry`}
                label={d.residenceCountry}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.occupation`}
                label={d.occupation}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.BVNNumber`}
                label={d.BVNNumber}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.employersName`}
                label={d.employersName}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.phoneNumber`}
                label={d.phoneNumber}
                required
                type="tel"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField<Schema>
                name={`directors.${index}.address`}
                label={d.address}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.email`}
                label={d.email}
                required
                type="email"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.taxIDNumber`}
                label={d.taxIDNumber}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.intPassNo`}
                label={d.intPassNo}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.passIssuedCountry`}
                label={d.passIssuedCountry}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Menu<Schema>
                name={`directors.${index}.idType`}
                label={d.idType}
                options={[
                  { value: "", label: "Choose Identification Type" },
                  { value: "international passport", label: "International Passport" },
                  { value: "NIMC", label: "NIMC" },
                  { value: "Drivers licence", label: "Driver's License" },
                  { value: "Voters Card", label: "Voter's Card" }
                ]}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.idNumber`}
                label={d.idNumber}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.issuedBy`}
                label={d.issuedBy}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker<Schema>
                name={`directors.${index}.issuedDate`}
                label={d.issuedDate}
                maxDate={new Date()}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker<Schema>
                name={`directors.${index}.expiryDate`}
                label={d.expiryDate}
                minDate={new Date()}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Menu<Schema>
                name={`directors.${index}.sourceOfIncome`}
                label={d.sourceOfIncome}
                options={[
                  { value: "", label: "Choose Income Source" },
                  { value: "salary", label: "Salary or Business Income" },
                  { value: "investments", label: "Investments or Dividends" },
                  { value: "other", label: "Other(please specify)", isOther: true }
                ]}
                onOtherSelected={() => {
                  setShowOtherIncomeSource(prev => ({ ...prev, [index]: true }));
                }}
              />
            </Grid>
            {showOtherIncomeSource[index] && (
              <Grid item xs={12} md={4}>
              <TextField<Schema>
                name={`directors.${index}.otherIncomeSource`}
                label={d.otherIncomeSource}
              />
              </Grid>
            )}
          </Fragment>
        );
      })}
      <Grid item xs={12}>
        <IconButton
          onClick={handleAddDirector}
          sx={{ color: 'success.main' }}
        >
          <AddCircleRoundedIcon />
          <Typography sx={{ ml: 1 }}>Add Director</Typography>
        </IconButton>
      </Grid>
    </Fragment>
  );
};
directors-ino/page: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Directors } from "./components/Directors";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { TextField } from "@/features/form/components/controllers/text-field";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Directors />
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate/financial-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.directorsInfo}
    >
      <FormErrorSummary />
      <Page />
      <TextField<Schema>
        name="phoneNumber"
        label="Phone Number"
        format="phoneNumber"
      />
    </Form>
  );
};


export { Provider as DirectorsInfo };
File-uploads: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateKYCDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Box } from "@mui/material";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          "Verification Document"
        </Typography>
        <FileUpload<Schema>
          name="verificationDocument"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/corporate/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
          sx: { mt: 4 }
        },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FileUploads };
Next form is individual-cdd: personal-info :import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import {Grid} from "@mui/material";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState(false);
  const [showOtherPremiumSource, setShowOtherPremiumSource] = useState(false);
  const { control } = useFormContext<Schema>();


  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField<Schema> name="title" label="Title" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="firstName" label="First Name" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="lastName" label="Last Name" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="contactAddress"
          label="Contact Address"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <Menu<Schema>
          name="gender"
          label="Gender"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="country" label="Residence Country" required />
      </Grid>


      <Grid item xs={6}>
        <DatePicker<Schema> name="dateOfBirth" label="Date Of Birth" />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="placeOfBirth" label="Place of Birth" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="emailAddress"
          label="Email"
          type="email"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="GSMno"
          label="Mobile Number"
          type="number"
          required
        />
      </Grid>


      <Grid item xs={12}>
        <TextField<Schema>
          name="residentialAddress"
          label="Residential Address"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="nationality" label="Nationality" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="occupation" label="Occupation" required />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema> name="position" label="Position" />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual-cdd/financial-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.personalInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as PersonalInfo };
Additional-info :  import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import {Grid} from "@mui/material";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState(false);
  const [showOtherPremiumSource, setShowOtherPremiumSource] = useState(false);
  const { control } = useFormContext<Schema>();
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);


  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Menu<Schema>
          name="businessType"
          label="Business Type"
          options={[
            { value: "Sole Proprietor", label: "Sole Proprietor" },
            { value: "Limited Liability Company", label: "Limited Liability Company" },
            { value: "Public Limited Company", label: "Public Limited Company" },
            { value: "Joint Venture", label: "Joint Venture" },
            { value: "Other", label: "Other(please specify)", isOther: true },
          ]}
          onOtherSelected={() => setShowOtherBusinessType(true)}
        />
      </Grid>


      {showOtherBusinessType && (
        <Grid item xs={6}>
          <TextField<Schema>
            name="otherBusinessType"
            label="Specify Business Type"
            required
          />
        </Grid>
      )}


      <Grid item xs={6}>
        <TextField<Schema>
          name="employersEmail"
          label="Employer's Email"
          type="email"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="employersName"
          label="Employer's Name"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="employersTelephoneNumber"
          label="Employer's Telephone Number"
          type="number"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="employersAddress"
          label="Employer's Address"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="taxidentificationNumber"
          label="Tax Identification Number"
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="BVNNumber"
          label="BVN"
          type="number"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <Menu<Schema>
          name="identificationType"
          label="ID Type"
          options={[
            { value: "International passport", label: "International passport" },
            { value: "NIMC", label: "NIMC" },
            { value: "Drivers Licence", label: "Drivers Licence" },
            { value: "Voters Card", label: "Voters Card" },
            { value: "NIN", label: "NIN" },
          ]}
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="identificationNumber"
          label="Identification Number"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <TextField<Schema>
          name="issuingCountry"
          label="Issuing Country"
          required
        />
      </Grid>


      <Grid item xs={6}>
        <DatePicker<Schema>
          name="issuedDate"
          label="Issued Date"
        />
      </Grid>


      <Grid item xs={6}>
        <DatePicker<Schema>
          name="expiryDate"
          label="Expiry Date"
        />
      </Grid>


      <Grid item xs={12} md={6}>
        <Menu<Schema>
          name="annualIncomeRange"
          label={"annual Income Range"}
          options={[
            { value: "lessThanOneMillion", label: "Less Than One Million" },
            { value: "1-4Million", label: "1 - 4 Million" },
            { value: "4.1-10Million", label: "4.1 - 10 Million" },
            { value: "moreThan10Million", label: "More Than 10 Million" },
          ]}
        />
      </Grid>
   
      <Grid item xs={12} md={6}>
        <Menu<Schema>
          name="premiumPaymentSource"
          label={"Premium Payment Source"}
           options={[
            { value: "Salary or Business Income", label: "Salary or Business Income" },
            { value: "Investments or Dividends", label: "Investments or Dividends" },
            { value: "Other", label: "Others(please specify)", isOther: true },
          ]}
          onOtherSelected={() => setShowOtherPremiumSource(true)}
        />
      </Grid>
      {showOtherPremiumSource && (
        <Grid item xs={12} md={6}>
         <TextField<Schema>
            name="otherPremiumPaymentSource"
            label={d.otherPremiumPaymentSource}
            required
          />
        </Grid>
      )}
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual-cdd/financial-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.personalInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as additionalInfo };
Financial-info : import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Divider } from "@mui/material";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          {d.localAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="accountNumber"
          label={d.accountNumber}
          required
          inputProps={{
            pattern: "[0-9]*",
            inputMode: "numeric",
            maxLength: 10,
            minLength: 7,
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="accountOpeningDate"
          label={d.accountOpeningDate}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          {d.foreignAccountDetails}
        </Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankName2"
          label={d.bankName}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="accountNumber2"
          label={d.accountNumber}
          inputProps={{
            pattern: "[0-9]*",
            inputMode: "numeric",
            maxLength: 10,
            minLength: 7,
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankBranch2"
          label={d.bankBranch}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="accountOpeningDate2"
          label={d.accountOpeningDate}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual-cdd/file-uploads");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.financialInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FinancialInfo };
File-uploads: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Box } from "@mui/material";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.meansOfIdentification}
        </Typography>
        <FileUpload<Schema>
          name="identification"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual-cdd/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
          sx: { mt: 4 }
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FileUploads };
Next is individual-kyc. Personal-info : import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { calculatePastDate } from "@/utils/calculatePastDate";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  const [showOtherIncomeSource, setShowOtherIncomeSource] = useState(false);
  const [showOtherPremiumSource, setShowOtherPremiumSource] = useState(false);
  const { control } = useFormContext<Schema>();


  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="officeLocation"
          label={d.officeLocation}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="title"
          label={d.title}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="firstName"
          label={d.firstName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="middleName"
          label={d.middleName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="lastName"
          label={d.lastName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="contactAddress"
          label={d.contactAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="occupation"
          label={d.occupation}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="gender"
          label={d.gender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfBirth"
          label={d.dateOfBirth}
          maxDate={calculatePastDate(18)}
          minDate={calculatePastDate(100)}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="mothersMaidenName"
          label={d.mothersMaidenName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="employersName"
          label={d.employersName}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="employersTelephoneNumber"
          label={d.employersTelephoneNumber}
          format="phoneNumber"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="employersAddress"
          label={d.employersAddress}
          multiline
          maxRows={3}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="city"
          label={d.city}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="state"
          label={d.state}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="country"
          label={d.country}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="nationality"
          label={d.nationality}
          options={[
            { value: "Nigerian", label: "Nigerian" },
            { value: "Foreign", label: "Foreign" },
            { value: "Both", label: "Both" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField<Schema>
          name="residentialAddress"
          label={d.residentialAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="GSMno"
          label={d.GSMno}
          format="phoneNumber"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="emailAddress"
          label={d.emailAddress}
          type="email"
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="taxIDNo"
          label={d.taxIDNo}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="BVN"
          label={d.BVN}
          required
          inputProps={{
            pattern: "[0-9]*",
            inputMode: "numeric",
            maxLength: 11,
            minLength: 11,
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="identificationType"
          label={d.identificationType}
          options={[
            { value: "International passport", label: "International Passport" },
            { value: "NIMC", label: "NIMC" },
            { value: "Drivers Licence", label: "Driver's License" },
            { value: "Voters Card", label: "Voter's Card" },
            { value: "NIN", label: "NIN" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="idNumber"
          label={d.idNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="issuedDate"
          label={d.issuedDate}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="expiryDate"
          label={d.expiryDate}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="sourceOfIncome"
          label={d.sourceOfIncome}
          options={[
            { value: "Salary or Business Income", label: "Salary or Business Income" },
            { value: "Investments or Dividends", label: "Investments or Dividends" },
            { value: "Other", label: "Other(please specify)", isOther: true },
          ]}
          onOtherSelected={() => setShowOtherIncomeSource(true)}
        />
      </Grid>
      {showOtherIncomeSource && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherSourceOfIncome"
            label={d.otherSourceOfIncome}
            required
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="annualIncomeRange"
          label={d.annualIncomeRange}
          options={[
            { value: "Less Than 1 Million", label: "Less Than 1 Million" },
            { value: "1 Million - 4 Million", label: "1 Million - 4 Million" },
            { value: "4.1 Million - 10 Million", label: "4.1 Million - 10 Million" },
            { value: "More than 10 Million", label: "More than 10 Million" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="premiumPaymentSource"
          label={d.premiumPaymentSource}
          options={[
            { value: "Salary or Business Income", label: "Salary or Business Income" },
            { value: "Investments or Dividends", label: "Investments or Dividends" },
            { value: "Other", label: "Others(please specify)", isOther: true },
          ]}
          onOtherSelected={() => setShowOtherPremiumSource(true)}
        />
      </Grid>
      {showOtherPremiumSource && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherPremiumPaymentSource"
            label={d.otherPremiumPaymentSource}
            required
          />
        </Grid>
      )}
    </Grid>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual/financial-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.personalInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as PersonalInfo };
Financila-info :  import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/individualKYCDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Typography, Box } from "@mui/material";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.meansOfIdentification}
        </Typography>
        <FileUpload<Schema>
          name="identification"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


type ProviderProps = { readOnly?: boolean };


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/individual/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
          sx: { mt: 4 }
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FileUploads };
Next form is naicom-company-cdd: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { Menu } from "@/features/form/components/controllers/menu";
import { Autocomplete } from "@/features/form/components/controllers/autocomplete";
import { useState } from "react";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  const [showOtherCompanyType, setShowOtherCompanyType] = useState(false);


  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="registeredCompanyAddress"
          label={d.registeredCompanyAddress}
          multiline
          maxRows={3}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="incorporationNumber"
          label={d.incorporationNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Autocomplete<Schema>
          name="incorporationState"
          options={d.nigerianStates}
          textFieldProps={{
            label: d.incorporationState,
            required: true,
          }}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="dateOfIncorporationRegistration"
          label={d.dateOfIncorporationRegistration}
          maxDate={new Date()}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="natureOfBusiness"
          label={d.natureOfBusiness}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Menu<Schema>
          name="companyLegalForm"
          label={d.companyLegalForm}
          options={[
            { value: "soleProprietor", label: "Sole Proprietor" },
            { value: "unlimitedLiabilityCompany", label: "Unlimited Liability Company" },
            { value: "limitedLiabilityCompany", label: "Limited Liability Company" },
            { value: "publicLimitedCompany", label: "Public Limited Company" },
            { value: "jointVenture", label: "Joint Venture" },
            { value: "other", label: "Other(please specify)", isOther: true }
          ]}
          onOtherSelected={() => setShowOtherCompanyType(true)}
        />
      </Grid>
      {showOtherCompanyType && (
        <Grid size={{ xs: 6 }}>
          <TextField<Schema>
            name="otherCompanyType"
            label={d.otherCompanyType}
            required
          />
        </Grid>
      )}
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="emailAddress"
          label={d.emailAddress}
          type="email"
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema> name="website" label={d.website} required />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="taxIdentificationNumber"
          label={d.taxIdentificationNumber}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="telephoneNumber"
          label={d.telephoneNumber}
          format="phoneNumber"
          required
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/naicom-company-cdd/directors-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={{ ...defaultValues, ...formData }}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title="Company Details"
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as CompanyDetails };
Directors-info is the same as the other  director info stuff.
The account-deatils: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import Grid from "@mui/material/Grid2";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { Typography, Divider } from "@mui/material";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>{d.localAccountDetails}</Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="accountNumber"
          label={d.accountNumber}
          required
          format="number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="accountOpeningDate"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>


      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>{d.foreignAccountDetails}</Typography>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankName2"
          label={d.bankName}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="accountNumber2"
          label={d.accountNumber}
          format="number"
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField<Schema>
          name="bankBranch2"
          label={d.bankBranch}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <DatePicker<Schema>
          name="accountOpeningDate2"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>
    </Grid>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/naicom-company-cdd/file-uploads");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: { endIcon: <ArrowForwardIosRoundedIcon /> },
      }}
      schema={schema}
      values={{ ...defaultValues, ...formData }}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.accountDetails}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as AccountDetails };
file-uploads:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Box, Typography } from "@mui/material";


const Page = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.cacCertificate}
        </Typography>
        <FileUpload<Schema>
          name="cacCertificate"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.identification}
        </Typography>
        <FileUpload<Schema>
          name="meansOfIdentification"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          NAICOM License Certificate
        </Typography>
        <FileUpload<Schema>
          name="cacForm"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


type ProviderProps = {
  readOnly?: boolean;
};


const Provider = ({ readOnly }: ProviderProps) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useStore();


  const handleSubmit: SubmitHandler<Schema> = (data) => {
    updateFormData(data);
    navigate("/kyc/naicom-company-cdd/review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
          sx: { mt: 4 }
        },
      }}
      schema={schema}
      values={formData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


export { Provider as FileUploads };
Next form is naicom-partners-cdd: company-details: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { Grid } from "@mui/material";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { LocationField } from "@/features/form/components/controllers/location-field/index";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField<Schema>
          name="registeredCompanyAddress"
          label={d.registeredCompanyAddress}
          required
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12}>
        <LocationField<Schema>
          countryFieldName="country"
          stateFieldName="state"
          cityFieldName="city"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="emailAddress"
          label={d.emailAddress}
          required
          type="email"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="website"
          label={d.website}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="contactPerson"
          label={d.contactPerson}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="contactPersonNo"
          label={d.contactPersonNo}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="taxIdentificationNumber"
          label={d.taxIdentificationNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="VATRegistrationNumber"
          label={d.VATRegistrationNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="incorporationNumber"
          label={d.incorporationNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="dateOfIncorporationRegistration"
          label={d.dateOfIncorporationRegistration}
     
          maxDate={new Date()}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="incorporationState"
          label={d.incorporationState}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="natureOfBusiness"
          label={d.natureOfBusiness}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="BVNNo"
          label={d.BVNNo}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="NAICOMLisenceIssuingDate"
          label={d.NAICOMLisenceIssuingDate}
     
          maxDate={new Date()}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="NAICOMLisenceExpiryDate"
          label=:d.NAICOMLisenceExpiryDate}
   
          minDate={new Date()}
        />
      </Grid>
    </Grid>
  );
};


export const CompanyInfo = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../directors-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.companyInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
Directors info is the same as the others.
account-details:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { Grid, Typography, Box } from "@mui/material";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Local Account Details
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="accountNumber"
          label={d.accountNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate"
          label={d.accountOpeningDate}
     
          maxDate={new Date()}
        />
      </Grid>


      <Grid item xs={12} sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Foreign Account Details (Optional)
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="accountNumber2"
          label={d.accountNumber}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankName2"
          label={d.bankName}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="bankBranch2"
          label={d.bankBranch}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate2"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>
    </Grid>
  );
};


export const AccountDetails = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../file-uploads");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.accountDetails}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
File-uploads: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Box, Typography, IconButton, Grid } from "@mui/material";
import { useState } from "react";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";


const Page = () => {
  const [showSecondIdentification, setShowSecondIdentification] = useState(false);


  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="incorporation"
          label={d.incorporation}
     
        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="identification"
          label={d.identification}
   
        />
      </Grid>
      {showSecondIdentification && (
        <Grid item xs={12}>
          <FileUpload<Schema>
            name="identification2"
            label={d.identification2}
         
          />
        </Grid>
      )}
      {!showSecondIdentification && (
        <Grid item xs={12}>
          <IconButton
            onClick={() => setShowSecondIdentification(true)}
            sx={{ color: "success.main" }}
          >
            <AddCircleRoundedIcon />
            <Typography sx={{ ml: 1 }}>Add Another Identification</Typography>
          </IconButton>
        </Grid>
      )}
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="formCO7"
          label={d.formCO7}


        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="VAT"
          label={d.VAT}
       
        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload<Schema>
          name="tax"
          label={d.tax}
       
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          For NAICOM Regulated Companies
        </Typography>
        <FileUpload<Schema>
          name="NAICOMForm"
          label={d.NAICOMForm}
        />
      </Grid>
    </Grid>
  );
};


export const FileUploads = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
Last form is  partners-cdd..company-details:import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { Grid } from "@mui/material";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { LocationField } from "@/features/form/components/controllers/location-field/index";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="companyName"
          label={d.companyName}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField<Schema>
          name="registeredCompanyAddress"
          label={d.registeredCompanyAddress}
          required
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12}>
        <LocationField<Schema>
          countryFieldName="country"
          stateFieldName="state"
          cityFieldName="city"
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="emailAddress"
          label={d.emailAddress}
          required
          type="email"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="website"
          label={d.website}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="contactPerson"
          label={d.contactPerson}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="contactPersonNo"
          label={d.contactPersonNo}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="taxIdentificationNumber"
          label={d.taxIdentificationNumber}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="VATRegistrationNumber"
          label={d.VATRegistrationNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="incorporationNumber"
          label={d.incorporationNumber}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DatePicker<Schema>
          name="dateOfIncorporationRegistration"
          label={d.dateOfIncorporationRegistration}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="incorporationState"
          label={d.incorporationState}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="natureOfBusiness"
          label={d.natureOfBusiness}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField<Schema>
          name="BVNNo"
          label={d.BVNNo}
          required
        />
      </Grid>
    </Grid>
  );
};


export const CompanyInfo = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../directors-info");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.companyInfo}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
Directors-info is as it is 👍moving to account-detaiils: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { DatePicker } from "@/features/form/components/controllers/date-picker";
import { TextField } from "@/features/form/components/controllers/text-field";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { Grid } from "@mui/material";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { Typography, Box } from "@mui/material";


const Page = () => {
  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Typography variant="h6" gutterBottom>
          Local Account Details
        </Typography>
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="accountNumber"
          label={d.accountNumber}
          required
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="bankName"
          label={d.bankName}
          required
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="bankBranch"
          label={d.bankBranch}
          required
        />
      </Grid>
      <Grid xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>


      <Grid xs={12} sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Foreign Account Details (Optional)
        </Typography>
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="accountNumber2"
          label={d.accountNumber}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="bankName2"
          label={d.bankName}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField<Schema>
          name="bankBranch2"
          label={d.bankBranch}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <DatePicker<Schema>
          name="accountOpeningDate2"
          label={d.accountOpeningDate}
          maxDate={new Date()}
        />
      </Grid>
    </Grid>
  );
};


export const AccountDetails = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../file-uploads");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.accountDetails}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};
 File-uploads: import { Form } from "@/features/form/components/form";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useStore } from "./hooks/useStore";
import { defaultValues, schema, Schema } from "./types/schema";
import { d } from "@/utils/corporateCDDDictionary/dictionary";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { FormErrorSummary } from "@/features/form/components/form-error-summary";
import { FileUpload } from "@/features/form/components/controllers/file-upload";
import { Box, Typography, IconButton } from "@mui/material";
import { useState } from "react";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";


const Page = () => {
  const [showSecondIdentification, setShowSecondIdentification] = useState(false);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.incorporation}
        </Typography>
        <FileUpload<Schema>
          name="incorporation"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.identification}
        </Typography>
        <FileUpload<Schema>
          name="identification"
          accept="image/*,.pdf"
        />
      </Box>
      {!showSecondIdentification && (
        <Box>
          <IconButton onClick={() => setShowSecondIdentification(true)} color="primary">
            <AddCircleRoundedIcon />
            <Typography sx={{ ml: 1 }}>Add Second Identification</Typography>
          </IconButton>
        </Box>
      )}
      {showSecondIdentification && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {d.identification2}
          </Typography>
          <FileUpload<Schema>
            name="identification2"
            accept="image/*,.pdf"
          />
        </Box>
      )}
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.formCO7}
        </Typography>
        <FileUpload<Schema>
          name="formCO7"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.VAT}
        </Typography>
        <FileUpload<Schema>
          name="VAT"
          accept="image/*,.pdf"
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {d.tax}
        </Typography>
        <FileUpload<Schema>
          name="tax"
          accept="image/*,.pdf"
        />
      </Box>
    </Box>
  );
};


export const FileUploads = () => {
  const { formData, updateFormData } = useStore();
  const navigate = useNavigate();


  const handleSubmit: SubmitHandler<Schema> = async (data) => {
    updateFormData(data);
    navigate("../review");
  };


  return (
    <Form
      submitButtonText={d.saveAndContinue}
      slotProps={{
        submitButtonProps: {
          endIcon: <ArrowForwardIosRoundedIcon />,
        },
      }}
      schema={schema}
      values={formData as Schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      title={d.fileUploads}
    >
      <FormErrorSummary />
      <Page />
    </Form>
  );
};


now, having added all this forms and  information, i know its a lot...i nned you to get a few things, uniformity is gold...so all phone number fields should be the phone number field in controller...there are parts where the full dates and times are asked, use date-time-picker, when only year or date  is asked, you use date-picker..... make sure all variable names and labels are well descriptively labelled.... i will give you the  documentation of the version one of this project...when you read it, ypu shuld finally get it..what i need is  for users, not admins or moderators or anything but he ones called default, to be required to sign up justbefore submission of forms, either with username and password or just google sign in... then i need them to also have a dashboard where they can view their persoal details as well as all the forms they submit...read only though... dowload those orms as well as any document they have submitted in pdf format too..., then they should be able to get notifications from either email or sms depending on what they pick during sign in, meanng the sign up process will consist of them picking how they want to get their notifications. ..of course each user can onl see their own stuff, pretty simple set up for user dashboard.. then for the admions like admin, super-admin, moderators....or now compliance. they have their own dashboard that will have widgets on top for total number of each form submitted  for the month with a small icon showinf=g a percentageincrease or decreadse ibthe lastr month...we can then have a greaph showing what kkinds of forms have been submitted for the day but we can toggele for month and year and then we also have a soace for latest submissions regardkess of what  form type they are maybe kyc, cdd or claims,  after that, thats the home page for the admin dashboard...of course we'll have the side bar and don forget icons..make the UX top class. then  the sidebar will have the claims, cdd or kyc options as a drop down so that when you click on one, all the ones that fall under it will be shown, so clicking oin vliams will show the money, motor and he rest in the side bar and it can be closed too... then whenn you click on one form maybe motor, we have a table  that has all the features shown in the documentation, then you can also click view on each entry, see all the data in a neat format, in sections the way it would look like in a normal hared copy form.  ..now only admins can  edit each entry in the single page view of the form .  but everybody else can download the submitted form and have it as a padf file mimicking exactly how a real form should look like, with company logo, address and all that at the top. and then also all the files uploaded if any should be there available for download too. then back outsde to the table., admins  can also delete entries... only them though. now this part i want to say only applies to claim forms but  when a cliam form is first submitted, the row should be light yellow to show it is pending. then an email is sent..actually an email is always sent to the user who submits their form that their form has been submitted and they will hear back soon. so yeah, and then oly after the admin or moderator has reviwed the entire form or data submitted can they now click an approved button in the form row  on the table and then the row turns green and an emai is sent to the user that  their claims has been approved. only for cliam forms thpugh...so yeah  then for the authentication, just follow the documentation....auth for the admin side i mean...you'll see that the  admins, moderators/compliance are added  manually by the super-admin and are nitiually default and cannot access the admin-dashboard  as they will always be blocked and shown an unauthourized poage..custom made. and stuff but will be sent a link to their email, only if its the super-admin that adds them  that mail will contain a  randomly generated password as well as a link to chage it and they will not be able to log oin with that password till they change it, and  will still not be able to  log in caus ethey will be direcvted to unauthourized till the suoer-admin chnage stheir permissions to either moderatror/compliance, admin or super-admin too. then they can log in...the logic for a lot of this are in my server.js...hmmm, what else..yeah, ensure you use amazing ux, add tooltips..and alsolets have a multi page landing page where they can click the links to whichever form they want...the users can see a login button but thats onl the one that users should use and if hey are logged in yhey can see a dashboard or profile icon or link in the navbar.  but only for users, the admin-dashboard is hidden, not liked or indexed....use images ...and oh very important, the color code for thois whole thing is  white, burundi and gold...mainly white..but we can have a sort f dark mode...also make sure that all fields are sanitized and validated thoroughly.... the admins  and compliance also get an email of every form filled. you can see that in the server file.so  yeah, now lemme go ahead and show you the  documementation of what io had before . here you go :.................................................................................................................................................................................................NEMCustomer DataCollectionApplication DocumentationA comprehensive guide to the NEM Customer Data CollectionApplication for compliance and data management. Version: Version 1.0 | February 14, 2024
Copyright © 2024 Oyeniyi Daniel. All rights reserved.
Disclaimer
This documentation has been prepared by Oyeniyi Daniel ("Freelance Developer") for NEMInsurance PLC ("Client") and is intended solely for the purpose of providing informationontheusage and functionality of the NEM Customer Data Collection Application ("the Application"). Please be aware of the following:
Limited Scope: This document is meant to serve as a user guide and explanationof theapplication's features and functionality. It is not a legal document, nor does it providelegal
advice. Responsibility: The responsibility for the use of the Application, including compliance withall
relevant laws, regulations, and industry standards, rests solely with the Client. The FreelanceDeveloper is not responsible for ensuring the Client's compliance with applicable legal andregulatory requirements. No Warranties: The Freelance Developer makes no warranties or representations, expressorimplied, regarding the accuracy, completeness, or suitability of the information providedinthisdocument. While efforts have been made to ensure the accuracy of the information, the FreelanceDeveloper does not guarantee that it is error-free. Third-Party References: This document may contain references to third-party products, services, or websites. Such references are for informational purposes only, and the FreelanceDeveloper does not endorse or assume any responsibility for the accuracy or reliabilityof thesethird-party resources. Updating Information: The information in this document is based on the knowledgeandunderstanding of the Application as of the date of its preparation. Changes in technology, laws, regulations, and industry practices may occur after this date. The Freelance Developer does not
commit to updating this document to reflect such changes.
Acceptance of Terms: By using this document, the Client acknowledges and accepts the termsand conditions outlined herein. If the Client does not agree with these terms, they shouldnot usethis document. This document is a product of the Freelance Developer's efforts to assist the Client inunderstanding the Application's operation and functionality. It is not a substitute for professional
legal, compliance, or regulatory advice, and the Client is strongly encouraged to seeksuchadvice where necessary to ensure full compliance with all relevant legal and regulatoryrequirements.
Table of Contents
1. Introduction
1.1 Purpose of the Application
1.2. Target Audience
2. Application Overview
2.1. High-Level Description
2.2. Technology Stack
3. Components and Pages
3.1 List of Pages
3.2. List of Components Component
4. Data Collection
4.1. Data Entry Process
4.2. Data Storage in Firebase Firestore:
4.3 Security, Access Control, and Data Privacy:
4.4. Data management and administration
5. . Dashboard
5.1. Accessing the Dashboard
5.2. Dashboard Features (View, Delete, Export)
5.3. Access Control Mechanisms
6. Security
6.1 Firebase Security Rules
6.2 Data Protection
6.3 Secure Development
6.4 Monitoring and Response
7. Support and Contact
7.1 Contact Information
7.2 Support Channels
Chapter One
Introduction
1.1 Purpose of the Application
The NEM Customer Data Collection Application serves a critical purpose in the realmofcustomer data management. It is designed to collect and securely store customer data, offeringareliable and efficient solution for businesses seeking to enhance their data collection processes. The core objectives of the application are as follows:
1. Data Collection: At its core, the application is built to streamline and optimizethecollection of customer data. It provides an intuitive and user-friendly platformfor gatheringvital customer information. 2. Data Security: The application prioritizes the security of customer data. All collectedinformation is stored in a secure database, ensuring the confidentiality and privacyofsensitive customer details. 3. Administrative Control: To facilitate effective data management, the applicationempowers administrators with the tools they need to access, oversee, and manipulatecollected user data. 1.2 Target Audience
The NEM Customer Data Collection Application is tailored to meet the specific needs of NEMInsurance PLC, a forward-thinking company aiming to modernize and optimize it’s customerdata collection processes. The target audience for this application primarily includes thepersonnel and stakeholders associated with NEM Insurance PLC. 1.3 Key Objectives for NEM Insurance PLC:
1) Simplify Data Collection: The application simplifies and digitizes the traditionallycumbersome processes of Collecting customer data for processes like KYC, proposal forms, etc for NEM Insurance PLC.
2) Efficient Data Collection: It provides a straightforward and efficient means to collect andmanage customer data, reducing administrative overhead and improving operational
efficiency. 3) Enhanced Data Security: The application guarantees the a high level of data security, ensuring compliance with data protection regulations and instilling trust amongNEMInsurance PLC's customers. By addressing these objectives, the application aligns seamlessly with NEMInsurance PLC'smission to enhance customer data management, reduce friction in the customer onboardingprocess, and elevate the overall customer experience.
Chapter Two
Application Overview
2.1 High-Level Description
The NEM Customer Data Collection Application is a web-based solution that leverages React
for the front-end and Firebase for data storage and management. This application is designedtostreamline the process of collecting and managing customer data in an efficient anduserfriendly manner. 2.2 Key Features:
1. User-Friendly Interface: The application offers an intuitive and user-friendly interfacethat allows users to easily input customer data. This simplifies the data collectionprocessand enhances user experience. 2. Data Storage and Management: Customer data is securely stored and managedusingFirebase. Firebase's Firestore is used as the database to ensure data consistency, reliability, and scalability. 3. Admin Dashboard: The application includes a secure admin dashboard accessibletoauthorized administrators and moderators. This dashboard serves as the central hubformanaging collected customer information. Admins can perform the following keyactions:
a. View Customer Data: Admins can access and view customer data, facilitatingeasy retrieval of information when needed. b. Data Deletion: The dashboard allows administrators to delete customer records, providing control over data maintenance and compliance with data protectionregulations. c. Data Export: Admins have the ability to export customer data for reportingandanalysis purposes. This feature enhances the utility of the application for businessinsights.
2.3 Use Cases:
1. Small and Large Businesses: businesses can utilize this application to efficientlycollect
and organize customer information, improving customer relationship management. 2. Customer Support Teams: Customer support teams can benefit fromthe streamlineddata collection process and easy access to customer data for issue resolution. 2.4 Technology Stack
The application relies on the following technologies to deliver its functionality:
1. React: React, a popular JavaScript library for building user interfaces, forms thefoundation of the application's front-end. 2. Firebase Firestore: Firebase Firestore serves as the database solution, ensuringdataintegrity and accessibility. 3. Node JS: This is a back-end JavaScript runtime for handling how the client side interactswith the server side
4. Express JS: Express.js is a web application framework for Node.js that simplifies theprocess of building web applications and APIs. It provides a set of methods for routingHTTP requests, configuring middleware, rendering HTML views, and modifyingapplication settings. By utilizing this technology stack, the application delivers a robust and responsiveuserexperience while maintaining the security and scalability required for effective data management.
Chapter 3
Components and Pages
The NEM Customer Data Collection Application consists of various components and pages that
collectively deliver a seamless user experience. Here's an overview of the main components andtheir functionalities:
3.1 Pages
1.Home Page:
a. The landing page of the application. b. Provides links for users to navigate to whatever form they would like to fill, for example, corporate or individual KYC forms
2. Individual KYC Form Page:
a. Allows individuals to submit their personal and financial information. b. Features a multistep form for collecting personal, additional, and financial information, along with file uploads for supporting documents. 3. Corporate KYC Form Page:
a. Enables companies to submit company and director details. b. Offers a multistep form for collecting company details, director information, andaccount/bank details, with file uploads for supporting documents. 4. Dashboard:
a. Provides administrators with a secure interface to manage and view collected data. b. Includes a dashboard homepage displaying an overview of collections, pages toviewindividual and corporate form collections separately, and detailed views for eachcollection entry.
3.2 Components:
1. Layout Components: These components are responsible for the overall structure andpresentation of the application. They include the Navbar and any layout-related
components. 2. Form Components: These components facilitate the data entry process for users. Theyinclude the multistep form components for the Form pages, as well as file upload
components. 3. Dashboard Components: Components within the dashboard interface, responsible for
displaying data collections and allowing administrators to view, manage, and export data. 4. Collection View Components: Components used to render detailed views of formsubmissions within the dashboard.
Chapter Four
Data Collection
The NEM Customer Data Collection Application is meticulously designed to collect andsafeguard customer data efficiently. Below is an in-depth look at how data collectionworkswhile ensuring data privacy and security:
4.1 Data Entry Process:
1. User Navigation
Users access the application's Home Page, where they are presented with the optiontochoose between the form options available, offering a tailored data submission
experience. 2. Form Submission:
Depending on their selection, users are guided through a meticulously crafted multi-stepform. These forms are designed for ease of use while ensuring comprehensive data
collection. 3. Multistep Forms:
Users provide requested details, including personal information, financial data, companydetails, director information, and file uploads of supporting documents. Each stepof theprocess is intuitively designed for user convenience. 4. Validation and Submission:
Data validation mechanisms like regex and dom-purify at the front end as well aslibraries like mongo-sanitize and HPP( HTTP Parameter Polution) at the backendareinplace to ensure the accuracy, completeness, and integrity of the information providedbyusers. Upon successful validation, users securely submit the form.\
4.2 Data Storage in Firebase Firestore:
1.. Firestore Database:
Firebase Firestore is a robust NoSQL cloud database provided by Google. It is designedtomeet
the data storage and retrieval needs of modern web and mobile applications. Here are somekeytechnical aspects to highlight:
a. Scalability: Firestore employs a horizontally scalable architecture, allowing it to handlevast
amounts of data and high concurrent access efficiently. The systemcan dynamicallydistribute data across multiple servers, ensuring responsive performance as yourapplication's user base and data volume expand. This automatic scaling is particularlyadvantageous for applications with unpredictable or rapid growth. b. Real-time Synchronization: One of Firestore's standout features is its real-timedatasynchronization capabilities. When data changes within your database, these changes areimmediately propagated to all connected clients, enabling real-time updates without theneedfor manual polling or refreshing. This real-time synchronization is crucial for applicationswhere instant updates and collaboration among users are necessary. c. Change Streams: Firestore allows you to listen to changes in your data through a featurecalled "change streams." With change streams, you can set up listeners that notifyyourapplication whenever data within a specific collection or document changes. This featureenables you to implement real-time notifications, chat applications, or collaborative featuresseamlessly. d. Offline Support: Firestore provides robust offline support, allowing mobile andwebapplications to work even when there's no internet connectivity. When a user is offline, Firestore caches data locally on their device. As soon as an internet connectionisreestablished, Firestore synchronizes the changes seamlessly, ensuring data consistencyandavailability. 2. Structured Collections:
Data is thoughtfully organized into structured collections, with each collection correspondingtoa specific form type (e.g., Individual Form, Corporate Form, User roles etc). Data is organized into structured collections in Firestore for several reasons:
a. Logical Organization: Collections provide a logical way to group related data. Forexample, having separate collections for Individual Forms and Corporate Forms makesit
easier to manage and query data specific to these form types. b. Simplified Queries: Structured collections simplify querying and retrieving data. Youcandirectly target a specific collection to retrieve the relevant information, reducingthecomplexity of your queries. c. Scalability: Having structured collections allows Firestore to scale efficiently, as it canmanage collections independently, distributing data more effectively as your applicationgrows. 3.. Document Entries:
Within each collection, individual form submissions are meticulously represented as document
entries. Each document contains the data submitted by a user.. below is an entity relationdiagram (ERD) of the database. Corporate form
| - company_id (String) |
| - name (String) |
| - address (String) |
| - identification_number (string) |
| - telephone_number (string) |
| (Note: Additional fields not shown) |
+------------------------+
| Individuals |
+------------------------+
| - individual_id (String) |
| - first_name (String) |
| - last_name (String) |
| - email (String) |
| - signature(link) |
| (Note: Additional fields not shown) |
+------------------------+
| User roles |
+------------------------+
| - user_id (String) |
| - user_name (String) |
| - user_email (String) |
| - user_password (String) |
| - user_role (string) |
+------------------------+
5. Unique Document IDs:
Firebase Firestore automatically assigns unique document IDs to each entry, ensuringdata separation and access control. The automatic assignment of unique document IDs by Firestore is crucial for data
separation and access control:
a. Data Separation: Unique document IDs ensure that data entries are isolated fromeachother.Without unique IDs, there could be conflicts and overlaps in data, especiallyincases where multiple users are submitting forms or documents simultaneously. Eachunique ID represents a distinct entry. b. Access Control: Unique IDs play a role in access control. Security rules can be set uptorestrict access based on these IDs. For example, only the owner of a specific document
can read or edit that document, enhancing data privacy and security. c. Consistency: Unique IDs help maintain data consistency, as there is no ambiguityabout
which document a reference points to. This clarity is valuable when implementingrelationships between documents. 4.3 Security, Access Control, and Data Privacy:
1. Firebase Security Rules:
Security rules within Firebase Firestore are thoughtfully configured to restrict data access. These rules precisely define who can read, write, and manage data collections. service cloud.firestore {
match /databases/{database}/documents {
..}
}
This top-level structure is where the Firestore security rules are defined. It indicates that
these rules apply to the documents within your Firestore database.
a. Default Read and Write Rules:
match /{document=**} {
allow read: if request.auth != null && request.auth.token.admin == true;
allow write: if request.auth != null && (request.auth.token.admin == true ||
request.auth.token.moderator == true);
}
This rule allows "admin" users to read all collections and documents. They must be
authenticated and have the "admin" role. It allows "admin" and "moderator" users to write to all collections and documents. Theymust be authenticated. "admin" users can also write. Essentially, this rule grants full access to "admin" users, allowing themto both readandwrite data, and "moderator" users can write data but not read user roles. b. User Roles Collection:
match /userroles/{userRoleId} {
allow read: if request.auth != null && request.auth.token.admin == true;
allow write: if request.auth != null && request.auth.token.admin == true;
}
This rule controls access to the "userroles" collection. "admin" users can read and write to this collection. They must be authenticated.
c. Individuals and Users Collections:
match /individuals/{individualId} {
allow read: if request.auth != null && (request.auth.token.admin == true ||
request.auth.token.moderator == true);
allow write: if true;
}
match /users/{userId} {
allow read: if request.auth != null && (request.auth.token.admin == true ||
request.auth.token.moderator == true);
allow write: if true;
}
These rules control access to the "individuals" and "users" collections. "admin" and"moderator" users can read from and write to these collections if they are authenticated. All users, including unauthenticated users, can write to these collections, but theystill
need to be authenticated to read. d Default Role Rules:
match /{document=**} {
allow read, write: if request.auth != null && request.auth.token.default == true;
}
This rule applies to all other collections and documents.
It allows "default" users to read and write. These users must be authenticated andhavethe "default" role. These security rules ensure that different user roles have appropriate access to different
parts of the Firestore database. "admin" users have the most privileges, followed by"moderator" users, and "default" users have the least access. The rules also ensure that
some data, like user roles, can only be modified by "admin" users, providing securityandaccess control to your data. 2. User Authentication:
Firebase Authentication guarantees that only authorized users, with proper access rights, can interact with and manage data within the application. Admins and moderators that have been authourized by admin must sign in to access thedashboard. 3. Data Privacy Compliance:
The application adheres to strict data privacy and protection standards. Customer dataistreated with the utmost confidentiality and is only accessible by authorized personnel for
legitimate business purposes. 4. Data Encryption:
Firebase provides encryption measures to protect data both in transit and at rest. Here'sadetailed explanation of how Firebase encrypts data:
a. Encryption in Transit:
● When data is transmitted between a client device and Firebase servers, it is encryptedto ensure secure communication. ● Firebase uses industry-standard SSL/TLS protocols to establish an encrypted connectionbetween the client and the server. ● This encryption prevents unauthorized access and ensures that data remains confidential
during transmission.
● The use of SSL/TLS protocols ensures that data is protected frominterceptionandtampering while in transit. b Encryption at Rest
● Firebase also employs encryption to protect data at rest, meaning when it is storedonFirebase servers. ● Several Firebase services, including Cloud Firestore, Cloud Functions for Firebase, andCloud Storage for Firebase, encrypt their data at rest . ● The encryption at rest is implemented by encrypting the data before it is writtentodiskon the Firebase servers. ● The encryption keys used for data at rest are managed by Firebase, ensuring that onlyauthorized parties can access the encrypted data. ● This encryption provides an additional layer of security, safeguarding the data evenifphysical access to the servers is compromised. It's important to note that Firebase handles encryption in transit and at rest automatically, without
requiring explicit configuration from the developer. This ensures that data is protectedthroughout its lifecycle within the Firebase ecosystem .Data Management and Administration4.4 Backend Services
The Backend service consists of a node js application that handles dashboard features like adminuser roles as well as data viewing as well as data collection and form submission , This nodejsapp is hosted on a backend service called Render which is a hosting service that providesaunified cloud platform for building and running apps and websites. They offer a range of features, including free TLS certificates, a global CDN, DDoS protection, private networks, andautodeploys from Git. Some key features of Render hosting services include zero downtime deploys, free and fully-managed TLS certificates, custom domains, manual or automatic scaling, optional
persistent disks, pull request previews, instant rollbacks, HTTP/2 support, DDoS protection, andBrotli compression. It is however important to note that the plan being used for for Render right
now is the free tier which might have a few limitations and it is recommend that the planbeupgraded as soon as possible to avoid later issues down the line.
4.5. Dashboard Interface:
Administrators access the dashboard, which provides an intuitive and secure interfaceforefficiently managing and viewing collected data. This involves pages for viewingdatacollections as well as viewing them individually. It has features like form download , data export
to excel, as well as for the admins, an interface to manage moderators and other user roles. 4.6. Collection Views:
Within the dashboard, administrators and moderators can effortlessly navigate through individual
form and corporate form collections separately. They have access to a comprehensive overviewof data entries, including the ability to review details and take necessary actions.it alsooffersadministrators an interface to create, assign roles to and delete moderators
In conclusion, the data collection process within the NEM Customer Data Collection Applicationis characterized by meticulous user experience design and rigorous data privacy measures. Firebase Firestore serves as the dependable data repository, backed by robust security, userauthentication, and encryption. The application places a paramount emphasis on data privacy, ensuring that customer data remains confidential, protected, and accessible only to authorizedpersonnel for legitimate business purposes.
Chapter 5
Dashboard
The admin dashboard in the NEM Customer Data Collection Application is a powerful tool
designed to provide administrators with comprehensive control over collected data. Below, you'll
find an in-depth explanation of how to access the dashboard, its extensive features, andtheaccess control mechanisms in place:
5.1 Accessing the Admin Dashboard:
1. Access Permissions:
To access the admin dashboard, users must have administrator or moderator-level access, which is typically granted through user roles and permissions by the administratorconfigured during the user registration. 2. Authentication:
Administrators are required to authenticate themselves by signing in withtheircredentials before gaining access to the dashboard. Firebase Authenticationensuressecure user verification. 3. Automatic Logout on Inactivity:
To enhance security, the admin dashboard includes an automatic logout feature. If anadministrator remains inactive for a specified period (in this case., 10 minutes), theapplication will automatically log them out to prevent unauthorized access. This featuresafeguards sensitive data when an administrator forgets to log out manually. 5.2 Dashboard Features:
1. Overview Widget:
Upon entering the dashboard, moderators are greeted with an overviewwidget that
provides a quick glance at the number of entries in Form submissions. This widget servesas an at-a- glance summary of monthly activities. 2. Robust Data Filtering and Sorting Options:
Moderators can filter entries based on specific date ranges, or on any column title onthetable example being company name or address. This feature enables targeteddataanalysis and reporting by narrowing down entries to a particular time frame or metric.
3. Collection Views:
The dashboard offers separate views for Form submissions. Moderators can effortlesslyswitch between these views to focus on a specific form type.
4. Detailed Entry View:
Moderators can click on individual entries within a collection to access detailedinformation about a user's submission. Here, they can review all submitted data.
5. Data Export as CSV:
One of the standout features of the dashboard is the ability to export data collectionsasCSV files. This functionality allows moderators to extract data for further analysisorreporting in spreadsheet software like Excel. 6.. PDF Download:
In the detailed entry view, moderators can download the entire user submission as aPDF
document. This feature is particularly useful when a physical copy of the data is required, such as for record-keeping or auditing purposes.
7. Data Deletion:
Moderators have the capability to delete specific entries when necessary. This featureensures data management flexibility while maintaining data privacy. 8. User Management:
Administrators have the added menu option and interface to manage users(moderators)by creating user accounts, assigning them roles according to their permissions as well asdeleting said users when they no longer require access to the dashboard
5.3 Access Control Mechanisms:
1. . Role-Based Access:
The dashboard operates on a role-based access control model. Access permissions areassigned based on user roles, ensuring that only authorized users can interact withandmanage data When a user is created by the administrator, they are automatically assignedthe default role which has no access or privileges in the dashboard I.e they cannot seethedashboard or interact with it, when the administrator assigns the user the roleofmoderator, the user is able to interact with the all the main features of the dashboardand
manage the data except for the administrator features. If the user is assigned the adminrole, then they gain the ability to manage users as has been earlier explained. This is doneby using the Firebase custom claims in conjunction with the server to ensure a secureandconvenient role based access mechanisms. 2. Firebase Security Rules:
Firebase Firestore security rules are implemented to enforce access control anddataprotection. These rules specify who can read, write, and manage data withinthedashboard. Refer to 4.3 for more information on this. 3. Secure User Authentication:
Firebase Authentication ensures that only authenticated administrators and moderatorscan access the dashboard. This authentication process adds an extra layer of securitytoprotect sensitive data. In summary, the admin dashboard of the NEM Data Collection Application is a robust tool formanaging and analyzing collected data. Administrators can access it throughsecureauthentication, utilize date filtering for targeted analysis, export data as CSV files, and downloadentries as PDF documents. The dashboard is designed with strict access control mechanisms, safeguarding data integrity and privacy while providing administrators with powerful datamanagement capabilities. The automatic logout feature further enhances security by preventingunauthorized access due to inactivity.
Chapter Seven
Security
Ensuring the security of data is paramount in the NEM Customer Data Collection Application. robust security measures have been implemented, including Firebase security rules, to protect
your information. Here's an overview of the security considerations:
7.1. Firebase Security Rules:
1. Role-Based Access Control (RBAC): Firebase security rules are structured basedontheprinciple of Role-Based Access Control. This means that access to different parts of theapplication is granted based on predefined user roles. For instance, only administratorshave access to sensitive data within the admin dashboard. 2. Fine-Grained Control: The security rules are finely tuned to specify who can read, write, and manage data. This fine-grained control ensures that users, whether regular or admin, only interact with data for which they have permission. 3. Authentication: Firebase Authentication is a fundamental layer of security. Users arerequired to authenticate themselves before accessing the application. This process ensuresthat only authorized individuals can interact with the data. 7.2. Data Protection:
1. Data Encryption: Data transmitted between the application and Firebase is encrypted, safeguarding it against interception or unauthorized access during transmission. 2. Data Integrity: Measures are in place to maintain the integrity of data stored in Firebase. This includes data validation and checks to prevent unauthorized modifications. 7.3. Secure Development:
1. Code Reviews: I conduct regular code reviews to identify and rectify potential securityvulnerabilities in the application's codebase. 2. Security Best Practices: I also follow industry best practices for web applicationsecurity, such as input validation, parameterized queries, and protection against commonweb vulnerabilities like Cross-Site Scripting (XSS) and Cross-Site Request Forgery
(CSRF).as well as implementing a CORS policy to ensure that only authorized sites andservers can communicate with the application
7.4. Monitoring and Response:
1. Logging and Monitoring: Robust logging and monitoring tools were employed todetect any suspicious or unauthorized activities. This allows us to respond swiftlytopotential security incidents. 2. Incident Response: In the event of a security incident, procedures have been put inplace to assess, mitigate, and notify affected parties promptly. 7.5 Backups and Recovery
The backup plan currently invoilves the periodic download of the data in CSVformat, firebase offers data periodic backup as well as Point-In-Time-Recovery features but onlyin the paid plan , as we go forward, this can be furtyher looked at. While precautions are taken to ensure your data's security, it's essential for users to also playapart in maintaining a secure environment. the following best practices are recommended:
i. Use strong, unique passwords for your accounts. ii. Keep your login credentials confidential. iii. Log out of your account when using shared or public computers. iv. Be cautious of phishing attempts or suspicious emails. By working together, we can maintain a high level of security and protect the integrity of datainthe NEM Customer Data Collection Application. Your trust and data security are of utmost
importance , and I remain committed to upholding the highest standards of security.
Chapter Eight
Support and Contact
As a Meticulous Web developer, I am dedicated to providing excellent support and assistancetoour users. Whether you have questions, need assistance, or encounter any issues while usingtheapplication, we’re here to help. Here's how you can get in touch with us:
8.1 Contact Information:
If you need to reach out to me for any reason, you can contact me via email or phone:
Email: adedaniel502@gmail.com
Phone: 0814 125 2812
My support is available during regular business hours, and I strive to respond to all inquiries
promptly. 8.2 Support Channels:
I offer multiple support channels to cater to your needs effectively:
Email Support: You can send me an email at adedaniel502@gmail.com with your questionsorconcerns. I will respond to your email as quickly as possible. Social Media: Stay updated and engage with me on my social media platforms. You canfollowus on Linkedin and Twitter for news, updates, and support. Bug Reporting: If you encounter any issues or bugs while using the application, you canreport
them directly throughmy contact channels. My services include regular reviews and addressingreported bugs. I value your feedback and strive to provide you with the best possible user experience. I amcommitted to assisting you with any inquiries, technical challenges, or feedback you mayhave.
Thank you for choosing the NEM Customer Data Collection Application. I look forwardtoserving you and ensuring that your experience with the application is smooth and productive

